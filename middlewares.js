const _ = require('lodash');

const Jwt = require('jsonwebtoken');
const Url = require('url');
const Config = require('./config');

const Role = require('./models/role');
const UORole = require('./models/users_organizations_roles');
const User = require('./models/user');

module.exports = {
  UserTokenMiddleware: () => {
    return async (req, res, next) => {
      if (!req.token) return next(null);
      req.roleId = 0;
      try {
        const user = await User.where({ api_key: req.token }).fetch();
        if (user) {
          req.user = await UORole.getUser(user.id);
          if (req.user.organizations) {
            req.organization = req.user.organizations[0];
          }
        } else {
          const decoded = Jwt.verify(req.token, Config.appKey);
          req.user = await UORole.getUser(decoded.userId);
          // if user just registred he does not have any records in roles added check
          if (req.user.organizations) {
            req.organization = _.find(req.user.organizations, org => { return org.id === decoded.orgId; });
          }
        }
        if (req.organization) {
          req.role = Role.sort(req.organization.roles)[0];
        } else {
          req.role = Role.PendingRoleId;
        }
        next(null);
      } catch (error) {
        next(null);
      }
    };
  },

  LoginRequired: (req, res, next) => {
    if (!req.user) {
      return res.boom.unauthorized('Authentication required', { success: false });
    }

    if (!req.user.isActive || !req.user.confirmedAt) {
      return res.boom.forbidden('User not confirmed or inactive', { success: false });
    }

    next(null);
  },

  OrgAdminRequired: (req, res, next) => {
    var redirect = req.headers.referer ? Url.parse(req.headers.referer).path : '/';

    if (!req.user) {
      return res.boom.unauthorized('Authentication required', { success: false, redirect: '/login?next=' + redirect });
    }

    if (!req.user.isActive || !req.user.confirmedAt) {
      return res.boom.forbidden('User not confirmed or inactive', { success: false });
    }

    if (!req.organization) {
      return res.boom.forbidden('User must be assigned to organization first', { success: false });
    }

    if (req.role.id !== Role.AdminRoleId) {
      return res.boom.unauthorized('Admin privileges required', { success: false, redirect: '/login?next=' + redirect });
    }

    next(null);
  }
};
