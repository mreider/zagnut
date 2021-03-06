const ModelBase = require('../db').modelBase;
const Bookshelf = require('../db').bookshelf;
const knex = require('../db').knex;
const _ = require('lodash');

const Subscribers = ModelBase.extend({
  tableName: 'subscribers'
},
{
  async getSubscribers(ownerTable, id, subowner, subownerId) {
    let data;

    if (!subowner && !subownerId) {
      data = await knex('subscribers').select().leftJoin('users as u', 'subscribers.userid', 'u.id').where({ owner: ownerTable, owner_id: String(id), subowner: null, subowner_id: null });
    } else {
      data = await knex('subscribers').select().leftJoin('users as u', 'subscribers.userid', 'u.id').where({ owner: ownerTable, owner_id: String(id), subowner: subowner, subowner_id: String(subownerId) });
    };
    let subscribers = [];
    data.forEach(element => {
      subscribers.push({ email: element.email, firstName: element.first_name, lastName: element.last_name, id: element.userid });
    });

    return subscribers;
  },

  async addDeleteUsers(ownerTable, ownerId, subowner, subownerId, usersId) {
    ownerId = String(ownerId);
    let dataToInsert = [];
    usersId = _.uniq(usersId);

    if (!subowner && !subownerId) {
      await knex('subscribers').del().where({ owner: ownerTable, owner_id: ownerId, subowner_id: null });
      usersId.forEach(element => {
        dataToInsert.push({ owner: ownerTable, owner_id: ownerId, userid: element });
      });
    } else if (subowner && subownerId) {
      await knex('subscribers').del().where({ owner: ownerTable, owner_id: ownerId, subowner_id: subownerId, subowner: subowner });
      usersId.forEach(element => {
        dataToInsert.push({ owner: ownerTable, owner_id: ownerId, userid: element, subowner: subowner, subowner_id: subownerId });
      });
    };

    if (dataToInsert.length === 0) return true;
    if (dataToInsert.length !== 0) {
      await knex('subscribers').insert(dataToInsert);
      return true;
    };
  },
  async DeleteUsers(ownerTable, ownerId, subowner, subownerId, usersId) {
    ownerId = String(ownerId);
    usersId = _.uniq(usersId);

    if (!subowner && !subownerId) {
      await knex('subscribers').del().where({ owner: ownerTable, owner_id: ownerId, subowner_id: null }).whereIn('userid', usersId);
    } else if (subowner && subownerId) {
      await knex('subscribers').del().where({ owner: ownerTable, owner_id: ownerId, subowner_id: subownerId, subowner: subowner }).whereIn('userid', usersId);
    };

    return true;
  }
}

);

module.exports = Bookshelf.model('Subscribers', Subscribers);
