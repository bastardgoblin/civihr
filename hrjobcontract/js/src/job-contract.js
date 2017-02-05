(function (CRM, require) {
  var extPath = CRM.jobContractTabApp.path + 'js/src/job-contract';

  require.config({
    paths: {
      'job-contract': extPath,
      'job-contract/vendor/fraction': extPath + '/vendor-custom/fraction',
      'job-contract/vendor/job-summary': extPath + '/vendor-custom/jobsummary'
    },
    shim: {
      'job-contract/vendor/job-summary': {
        deps: ['common/moment']
      }
    }
  });

  require([
    'job-contract/app'
  ], function () {
    'use strict';

    document.dispatchEvent(typeof window.CustomEvent == "function" ? new CustomEvent('hrjcReady') : (function(){
      var e = document.createEvent('Event');
      e.initEvent('hrjcReady', true, true);
      return e;
    })());
  });
})(CRM, require);
