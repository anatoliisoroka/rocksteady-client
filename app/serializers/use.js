import ApplicationSerializer from './application';

export default ApplicationSerializer.extend({
    extractArray: function (store, type, payload, id, requestType) {
        if (payload.uses_children) {
            for (var i = 0; i < payload.uses_children.length; i++) {
                for (var j = 0; j < payload.uses.length; j++) {
                    if (!payload.uses[j].children_ids) {
                        continue;
                    }
                    for (var k = 0; k < payload.uses[j].children_ids.length; k++) {
                        if (payload.uses_children[i].id === payload.uses[j].children_ids[k]) {
                            payload.uses_children[i].parent_id = payload.uses[j].id;
                        }
                    }
                }
                payload.uses.push(payload.uses_children[i]);
            }
        }

        if (payload.uses) {
            for (var l = 0; l < payload.uses.length; l++) {
                delete payload.uses[l].children_ids;
            }
        }

        delete payload.uses_children;

        return this._super(store, type, payload, id, requestType);
    }
});

