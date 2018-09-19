const _ = require('lodash');
const Express = require('express');
const Nodemailer = require('nodemailer');
const SendGridTransport = require('nodemailer-sendgrid-transport');
const Handlebars = require('nodemailer-express-handlebars');
const Config = require('../config');

const {validate, LoginSchema, RegisterSchema} = require('../validation');

const User = require('../models/user');

const router = Express.Router();
const mailer = Nodemailer.createTransport(SendGridTransport(Config.mailerConfig));
mailer.use('compile', Handlebars(Config.mailerConfig.rendererConfig));

router.post('/login', validate(LoginSchema), async (req, res) => {
  const email = req.body.email;
  const password = req.body.password;

  const user = await User.where({email}).fetch({withRelated: ['organizations']});
  if (!user) return res.boom.notFound('Not found', {success: false, message: `User with email ${email} not found.`});
  if (!user.get('isActive') || !user.get('confirmedAt')) return res.boom.forbidden('Forbidden', {success: false, message: 'User not confirmed or inactive'});

  await user.checkPassword(password);

  const orgId = _.get(user.related('organizations'), 'models[0].id');

  const token = await user.generateToken({}, {organizationId: orgId});
  res.json({token: token, success: true});
});

router.post('/register', validate(RegisterSchema), async (req, res) => {
  const email = req.body.email;
  const password = req.body.password;
  const firstName = req.body.firstName;
  const lastName = req.body.lastName;
  const organization = req.body.organization;
  const confirmation = req.body.confirmation;

  let user = await User.where({email}).fetch();
  if (user) return res.boom.conflict('Exists', {success: false, message: `User with email ${email} already exists`});
  if (password !== confirmation) return res.boom.conflict('Not confirmed password', {success: false, message: `Password and confirmation doesn't match`});

  user = await User.create(email, password, firstName, lastName, organization);
  const token = await user.generateToken({expiresIn: '1d'});

  var mail = {
    from: Config.mailerConfig.from,
    to: user.get('email'),
    subject: 'Email verification',
    template: 'email-verification',
    context: {
      confirm_url: Config.siteUrl + 'verify/?token=' + token
    }
  };

  mailer.sendMail(mail);
  res.json({userId: user.id, success: true});
});

module.exports = router;
