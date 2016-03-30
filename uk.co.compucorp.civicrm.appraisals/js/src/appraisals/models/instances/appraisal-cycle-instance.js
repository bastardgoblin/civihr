define([
    'common/lodash',
    'common/moment',
    'appraisals/modules/models-instances',
    'common/services/api/appraisal-cycle',
    'common/models/instances/instance',
    'appraisals/models/appraisal'
], function (_, moment, instances) {
    'use strict';

    instances.factory('AppraisalCycleInstance', ['$q', 'Appraisal', 'ModelInstance',
        'api.appraisal-cycle', 'HR_settings',
        function ($q, Appraisal, ModelInstance, appraisalCycleAPI, HR_settings) {

            var DUE_DATE_FIELD_TO_STATUS_ID = {
                cycle_self_appraisal_due:    '1',
                cycle_manager_appraisal_due: '2',
                cycle_grade_due:             '3'
            };

            /**
             * Memoized version of the nextDueDate() method
             *
             * @param {string} id - A unique identifier to retrieve the memoized result
             * @param {object} dueDates - The due dates field/value pairs
             * @return {null/object}
             */
            var nextDueDate = _.memoize(function nextDueDates(id, dueDates) {
                var today, dates, date;
                var dateFormat = HR_settings.DATE_FORMAT.toUpperCase();

                today = moment();
                dates = _.chain(dueDates)
                    .transform(function (result, date, key) {
                        result[key] = moment(date, dateFormat);
                    })
                    .pick(function (date) {
                        return date.isSameOrAfter(today, 'day');
                    })
                    .value();

                if (_.isEmpty(dates)) {
                    return null;
                }

                date = moment.min.apply(moment, _.values(dates));

                return {
                    date: date.format(dateFormat),
                    status_id: DUE_DATE_FIELD_TO_STATUS_ID[_.findKey(dates, function (date) {
                        return date === date;
                    })]
                };
            });

            /**
             * Calculates total number of appraisals and completion percentage
             *
             * @param {Array} status
             *   A list of every step with appraisals, each containing
             *   its id and the number of appraisals in it
             */
            function calculateAppraisalsFigures(status) {
                this.statuses = _.reduce(status, function (accumulator, step) {
                    accumulator[step.status_id] = {
                        name: step.status_name,
                        appraisals_count: step.appraisals_count,
                    };

                    if (step.appraisals) {
                        accumulator[step.status_id].appraisals = step.appraisals;
                    }

                    this.appraisals_count += +step.appraisals_count;

                    return accumulator;
                }, {}, this);

                if (this.appraisals_count > 0) {
                    this.completion_percentage = Math.round(this.statuses['5'].appraisals_count * 100 / this.appraisals_count);
                }
            }

            return ModelInstance.extend({

                /**
                 * Returns the default custom data (as in, not given by the API)
                 * with its default values
                 *
                 * @return {object}
                 */
                defaultCustomData: function () {
                    return {
                        appraisals: {},
                        appraisals_count: 0,
                        completion_percentage: 0,
                        statuses: {}
                    };
                },

                /**
                 * Returns an object made of only the due dates properties
                 *
                 * @return {object}
                 */
                dueDates: function () {
                    return _.pick(this.attributes(), function (value, key) {
                        return _.endsWith(key, '_due');
                    });
                },

                /**
                 *
                 *
                 */
                fromAPIFilter: function (result, __, key) {
                    var dateFormat = HR_settings.DATE_FORMAT.toUpperCase();

                    if (_.endsWith(key, '_date') || _.endsWith(key, '_due')) {
                        result[key] = moment(this[key], 'YYYY-MM-DD').format(dateFormat);
                    } else if (key === 'api.AppraisalCycle.getappraisalsperstep') {
                        calculateAppraisalsFigures.call(result, this[key].values);
                    } else if (key === 'cycle_is_active') {
                        // must be able to convert '0' to false
                        result[key] = !!(+this[key]);
                    } else {
                        result[key] = this[key];
                    }
                },

                /**
                 * Checks if the status with the given id is overdue
                 *
                 * @param {int/string} id
                 * @return {boolean}
                 */
                isStatusOverdue: function (id) {
                    var dateFormat = HR_settings.DATE_FORMAT.toUpperCase();
                    var field = _.invert(DUE_DATE_FIELD_TO_STATUS_ID)[id];

                    return moment(this[field], dateFormat).isBefore(moment());
                },

                /**
                 * Stores internally, or return, the list of its own appraisals
                 *
                 * @param {object} filters
                 * @param {object} pagination
                 * @param {boolean=true} store
                 *   If `false`, it will return the appraisals list instead of
                 *   storing it internally
                 * @return {Promise}
                 */
                loadAppraisals: function (filters, pagination, store) {
                    store = !(store === false);

                    filters = _.defaults({ appraisal_cycle_id: this.id }, filters);

                    return Appraisal.all(filters, pagination)
                        .then(function (appraisals) {
                            if (store) {
                                this.appraisals = appraisals;
                            } else {
                                return appraisals;
                            }
                        }.bind(this));
                },

                /**
                 * Returns the next available due date based on the current date,
                 * or `null` if there are no more due dates left
                 *
                 * The date is an object containing the actual date and the
                 * id of the status it belongs to
                 *
                 * @return {null/object}
                 */
                nextDueDate: function () {
                    var dates = this.dueDates();
                    // In case the id is not present, use the name as part of
                    // the identifier for the memoized function
                    var id = (this.id || this.name) + _.values(dates).join('');

                    return nextDueDate(id, dates);
                },

                /**
                 *
                 *
                 */
                toAPIFilter: function (result, __, key) {
                    var dateFormat = HR_settings.DATE_FORMAT.toUpperCase();
                    var blacklist = ['appraisals', 'appraisals_count',
                        'completion_percentage'];

                    if (_.endsWith(key, '_date') || _.endsWith(key, '_due')) {
                        result[key] = moment(this[key], dateFormat).format('YYYY-MM-DD');
                    } else if (_.includes(blacklist, key)) {
                        return;
                    } else {
                        result[key] = this[key];
                    }
                },

                /**
                 * Updates the instance with the new data
                 *
                 * @param {object} attributes - The new data
                 * @return {Promise}
                 *   resolved with the appraisals api update's promise
                 *   rejected if there is no id set on the instance
                 */
                update: function (attributes) {
                    var deferred = $q.defer();

                    if (!!this.id) {
                        deferred.resolve(appraisalCycleAPI.update(this.toAPI()).then(function (attributes) {
                            _.assign(this, this.fromAPI(attributes)); // Updates own attributes
                        }.bind(this)));
                    } else {
                        deferred.reject('ERR_UPDATE: ID_MISSING');
                    }

                    return deferred.promise;
                }
            });
        }
    ]);
});
