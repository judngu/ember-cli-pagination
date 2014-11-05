import Ember from 'ember';
import Util from 'ember-cli-pagination/util';

var ArrayProxyPromiseMixin = Ember.Mixin.create(Ember.PromiseProxyMixin, {
  then: function(success,failure) {
    var promise = this.get('promise');
    var me = this;

    promise.then(function() {
      success(me);
    }, failure);
  }
});

export default Ember.ArrayProxy.extend(ArrayProxyPromiseMixin, {
  page: 1,
  paramMapping: {},

  init: function() {
    this.set('promise', this.fetchContent());
  },

  paramsForBackend: function() {
    var page = parseInt(this.get('page') || 1);
    var perPage = parseInt(this.get('perPage'));
    //var store = this.get('store');
    //var modelName = this.get('modelName');

    var ops = {};

    var me = this;
    function setOp(key,val,defaultKey) {
      if (val) {
        key = me.get('paramMapping')[key] || defaultKey || key;
        ops[key] = val;
      }
    }
    
    setOp("page",page);
    setOp("perPage",perPage,"per_page");

    // take the otherParams hash and add the values at the same level as page/perPage
    var otherOps = this.get('otherParams') || {};
    for (var key in otherOps) {
      Util.log("otherOps key " + key);
      var val = otherOps[key];
      ops[key] = val;
    }

    return ops;
  }.property('page','perPage','paramMapping'),

  fetchContent: function() {
    var store = this.get('store');
    var modelName = this.get('modelName');

    var ops = this.get('paramsForBackend');
    var res = store.find(modelName, ops);
    var me = this;

    res.then(function(rows) {
      Util.log("PagedRemoteArray#fetchContent in res.then " + rows);
      var newMeta = {};
      for (var i in rows.meta) { newMeta[i] = rows.meta[i]; }      
      return me.set("meta", newMeta);
    }, function(error) {
      Util.log("PagedRemoteArray#fetchContent error " + error);
    });

    return res;
  },  

  totalPagesBinding: "meta.total_pages",

  pageChanged: function() {
    this.set("promise", this.fetchContent());
  }.observes("page", "perPage")
});