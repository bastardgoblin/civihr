/* eslint-env amd */
(function (CRM) {
  define([
    'common/angular'
  ], function (angular) {
    return angular.module('leave-absences.settings', []).constant('shared-settings', {
      attachmentToken: CRM.vars.leaveAndAbsences.attachmentToken,
      debug: CRM.debug,
      managerPathTpl: CRM.vars.leaveAndAbsences.baseURL + '/views/manager-leave/',
      pathTpl: CRM.vars.leaveAndAbsences.baseURL + '/views/shared/',
      serverDateFormat: 'YYYY-MM-DD',
      serverDateTimeFormat: 'YYYY-MM-DD HH:mm:ss',
      fileUploader: {
        // TODO for now set the limit to 10 files until a better solution is found to configure it
        queueLimit: 10,
        // set the mime types which are allowed to be uploaded as attachments
        allowedMimeTypes: {
          'txt': 'plain',
          'png': 'png',
          'jpeg': 'jpeg',
          'bmp': 'bmp',
          'gif': 'gif',
          'pdf': 'pdf',
          'doc': 'msword',
          'docx': 'vnd.openxmlformats-officedocument.wordprocessingml.document',
          'xls': 'vnd.ms-excel',
          'xlsx': 'vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          'ppt': 'vnd.ms-powerpoint',
          'pptx': 'vnd.openxmlformats-officedocument.presentationml.presentation'
        }
      },
      // TODO move all strings to a separate file otherwise this settings files will become a string repository
      statusNames: {
        approved: 'approved',
        adminApproved: 'admin_approved',
        awaitingApproval: 'awaiting_approval',
        moreInformationRequired: 'more_information_required',
        rejected: 'rejected',
        cancelled: 'cancelled'
      }
    });
  });
})(CRM);