define(['controllers/controllers'], function(controllers){
    controllers.controller('ExampleCtrl',['$scope', '$log', '$routeParams', 'ExampleService', '$route', '$timeout',
        function($scope, $log, $routeParams, ExampleService, $route, $timeout){
            $log.debug('Controller: ExampleCtrl');

            $scope.dpOpen = function($event){
                $event.preventDefault();
                $event.stopPropagation();

                $scope.picker.opened = true;

            };

            // Validate fields
            $scope.validateTitle = function(data) {
                if (data == 'title' || data == ' ') {
                    return "Title cannot be title!";
                }
            };

            $scope.validateDate = function(data) {
                    return "" + data;
            };

            $scope.today = function() {
                //$scope.newStartDate = new Date();
                console.log('set today');

                $scope.CalendarShow['newStartDate'] = false;
                $scope.CalendarShow['newEndDate'] = false;
            };

            // As default hide the datepickers
            $scope.CalendarShow = [];

            // Init values
            $scope.today();

            // Set required min date
            $scope.toggleMin = function() {
                $scope.minDate = $scope.minDate ? null : new Date(2000, 01, 01);
            };
            $scope.toggleMin();
            $scope.maxDate = new Date(2020, 5, 22);

            $scope.open = function(event) {
                console.log('open test');
                console.log(event);
                $scope.CalendarShow[event] = true;
            };

            $scope.select = function(event) {
                console.log('selected');
                console.log(event);
                $scope.CalendarShow[event] = false;
            };

            // Tracks collapsed / expanded rows
            $scope.collapsedRows = [];

            // Tracks clicked tabs per each row
            $scope.view_tab = [];

            // Tracks edit data changes on the forms
            $scope.edit_data = {};

            // Define the add new role URL
            $scope.add_new_role_url = $scope.$parent.pathBaseUrl + $scope.$parent.pathIncludeTpl + 'add_new_role.html';

            // Store the contractsData
            $scope.contractsData = [];

            // Store the level types
            $scope.LevelsData = {};

            // Store the location types
            $scope.LocationsData = {};

            // Store the region types
            $scope.RegionsData = {};

            // Store the department types
            $scope.DepartmentsData = {};

            // Contact List IDs array to use for the select lists
            $scope.contactList = [];

            // Contact List object stores more details about the contact
            $scope.contactListObject = {};

            // Implement angular tabs
            $scope.changeTab = function(row_id, tab_id) {
                $scope.view_tab[row_id] = tab_id;
            };

            // Check if current tab
            $scope.isTab = function(row_id, tab_id) {

                if ($scope.view_tab[row_id] == tab_id) {
                    return true;
                }

                return false;
            };

            // Check for collapsed rows
            $scope.isThingsCollapsed = function(row_id) {

                if ($scope.collapsedRows[row_id] == true) {
                    return true;
                }

                else if ($scope.collapsedRows[row_id] == false) {
                    return false;
                }

                return true;
            };

            // Collapse the row or Expand when clicked
            $scope.collapseRow = function(row_id) {

                // If already collapsed, expand
                if ($scope.collapsedRows[row_id] == false) {
                    $scope.collapsedRows[row_id] = true;
                }
                else {
                    $scope.collapsedRows[row_id] = false;
                }

            };

            // Set the data from the webservice call
            $scope.initData = function(role_id, form_id, data) {

                // Check if we have the array already
                if (typeof $scope.edit_data[role_id] == "undefined") {
                    $scope.edit_data[role_id] = {};
                }

                // If we have funders or cost centers, we have a special way to init our data
                if (form_id == 'funders') {

                    // Init empty array for funder default values
                    $scope.edit_data[role_id]['funders'] = [];

                    // Split data from the stored funder contact IDs
                    var funder_contact_ids = data['funder'].split("|");

                    // Split the funder types
                    var funder_types = data['funder_val_type'].split("|");

                    // Split the percent value for the funder
                    var percent_funders = data['percent_pay_funder'].split("|");

                    // Split the amount value for the funder
                    var amount_funders = data['amount_pay_funder'].split("|");

                    // Loop data and crete the required array of values
                    for (var i = 0; i < funder_contact_ids.length; i++) {

                        if (funder_contact_ids[i] != "") {

                            // Set default funder rows funder rows
                            $scope.edit_data[role_id]['funders'].push({
                                id: $scope.edit_data[role_id]['funders'].length + 1,
                                funder_id: { id: funder_contact_ids[i], sort_name: job_roles.contactListObject[funder_contact_ids[i]]['sort_name'] },
                                type: funder_types[i],
                                percentage: percent_funders[i],
                                amount: amount_funders[i]
                            });

                        }

                    }

                }

                // If we have funders or cost centers, we have a special way to init our data
                else if (form_id == 'cost_centers') {

                    // Init empty array for funder default values
                    $scope.edit_data[role_id]['cost_centers'] = [];

                    // Split data from the stored funder contact IDs
                    var cost_center_contact_ids = data['cost_center'].split("|");

                    // Split the cost_centers types
                    var cost_center_types = data['cost_center_val_type'].split("|");

                    // Split the percent value for the cost_center
                    var percent_cost_centers = data['percent_pay_cost_center'].split("|");

                    // Split the amount value for the cost_center
                    var amount_cost_centers = data['amount_pay_cost_center'].split("|");

                    // Loop data and crete the required array of values
                    for (var i = 0; i < cost_center_contact_ids.length; i++) {

                        if (cost_center_contact_ids[i] != "") {

                            // Set default funder rows funder rows
                            $scope.edit_data[role_id]['cost_centers'].push({
                                id: $scope.edit_data[role_id]['cost_centers'].length + 1,
                                cost_centre_id: cost_center_contact_ids[i],
                                type: cost_center_types[i],
                                percentage: percent_cost_centers[i],
                                amount: amount_cost_centers[i]
                            });

                        }

                    }

                }

                else {

                    // Default data init
                    $scope.edit_data[role_id][form_id] = data;

                }
            };

            // Check if the data are changed in the form (based on job role ID)
            $scope.isChanged = function(row_id) {

                // If there are data it means we edited the form
                if ($scope.edit_data[row_id]['is_edit'] == true) {
                    return true;
                }

                return false;
            };

            // Set the is_edit value
            $scope.showSave = function(row_id) {
                $scope.edit_data[row_id]['is_edit'] = true;
            };

            /**
             * Check if we allow to submit the form
             * Rule -> Allow only if the minimum required data are filled
             * @returns {boolean}
             */
            $scope.checkNewRole = function() {

                if(typeof $scope.edit_data['new_role_id'] === 'undefined'
                    || typeof $scope.edit_data['new_role_id']['title'] === 'undefined'
                    || $scope.edit_data['new_role_id']['title'] == ''
                    || typeof $scope.edit_data['new_role_id']['job_contract_id'] === 'undefined'
                    || $scope.edit_data['new_role_id']['job_contract_id'] == '') {

                    return true;
                }

                return false;
            };

            // Saves the new Job Role
            $scope.saveNewRole = function(data) {

                $log.debug('Add New Role');

                // Create the new job role
                createJobRole($scope.edit_data.new_role_id);

                // Get job roles based on the passed Contact ID (refresh part of the page)
                getJobRolesList($scope.$parent.contactId);

                // Hide the add new form
                $scope.add_new = false;

                // Remove if any data are added / Reset form
                delete $scope.edit_data['new_role_id'];

                // Hide the empty message if visible
                $scope.empty = false;

            };

            // Sets the add new job role form visibility
            $scope.add_new_role = function() {
                $scope.add_new = true;
            };

            // Hides the add new job role form
            $scope.cancelNewRole = function() {
                $scope.add_new = false;

                // Remove if any data are added / Reset form
                delete $scope.edit_data['new_role_id'];
            };

            // Removes the Role based on Role ID
            $scope.removeRole = function(row_id) {

                $log.debug('Remove Role');

                // Delete job role
                deleteJobRole(row_id);

                // Get job roles based on the passed Contact ID (refresh part of the page)
                getJobRolesList($scope.$parent.contactId);

            };

            $scope.updateRole = function(role_id) {

                $log.debug('Update Role');

                // Update the job role
                updateJobRole(role_id, $scope.edit_data[role_id]);

                // Get job roles based on the passed Contact ID (refresh part of the page)
                getJobRolesList($scope.$parent.contactId);
            };

            // Select list for Row Types (used for Funders and Cost Centers)
            $scope.rowTypes = {};
            $scope.rowTypes[0] = {id: 0, name: 'Fixed'};
            $scope.rowTypes[1] = {id: 1, name: '%'};

            //$scope.rowTypes = [ {id: 0, name: 'Fixed'}, {id: 1, name: '%'}];

            // Show Row Type default value
            $scope.showRowType = function(object) {

                var selected = '';

                if(typeof object.type !== "undefined") {

                    // Get the human readable Type Value
                    selected = $scope.rowTypes[object.type];

                    return selected.name;

                }

                return 'Not set';
            };

            $scope.getCostLabel = function(id) {
                var label = '';
                angular.forEach($scope.CostCentreList, function(v, k){
                    if(v.id == id){
                        label = v.title;
                    }
                });

                return label;
            };

            // Update funder type scope on request
            $scope.updateAdditionalRowType = function(role_id, row_type, key, data) {

                if (row_type == 'cost_centre') {

                    // Update cost centers row
                    $scope.edit_data[role_id]['cost_centers'][key]['type'] = data;
                }
                else {

                    // Update funder Type scope as default
                    $scope.edit_data[role_id]['funders'][key]['type'] = data;
                }

            };

            // Add additional rows (funder or cost centres)
            $scope.addAdditionalRow = function(role_id, row_type) {

                // Check if we have the array already
                if (typeof $scope.edit_data[role_id] == "undefined") {
                    $scope.edit_data[role_id] = {};
                }

                if (row_type == 'cost_centre') {

                    // Add cost centres
                    // Check if we have the array already
                    if (typeof $scope.edit_data[role_id]['cost_centers'] == "undefined" || !($scope.edit_data[role_id]['cost_centers'] instanceof Array)) {
                        $scope.edit_data[role_id]['cost_centers'] = [];
                    }

                    $scope.edit_data[role_id]['cost_centers'].push({
                        id: $scope.edit_data[role_id]['cost_centers'].length + 1,
                        cost_centre_id: '',
                        type: "1",
                        percentage: "0",
                        amount: "0"
                    });

                }

                else {

                    // As default add funder rows
                    // Check if we have the array already
                    if (typeof $scope.edit_data[role_id]['funders'] == "undefined" || !($scope.edit_data[role_id]['funders'] instanceof Array)) {
                        $scope.edit_data[role_id]['funders'] = [];
                    }

                    $scope.edit_data[role_id]['funders'].push({
                        id: $scope.edit_data[role_id]['funders'].length + 1,
                        funder_id: '',
                        type: "1",
                        percentage: "0",
                        amount: "0"
                    });
                }
            };

            // Delete Additional rows (funder or cost centres)
            $scope.deleteAdditionalRow = function(role_id, row_type, row_id) {

                if (row_type == 'cost_centre') {

                    // Remove the cost centre row
                    $scope.edit_data[role_id]['cost_centers'].splice(row_id, 1);
                }
                else {

                    // Remove the funder row as default
                    $scope.edit_data[role_id]['funders'].splice(row_id, 1);
                }
            };

            // Variable to check if we adding new job role
            var job_roles = this;

            // Get the option groups and option values
            getOptionValues();

            // Get job roles based on the passed Contact ID
            getJobRolesList($scope.$parent.contactId);

            // Get the contact list and store the data
            getContactList();

            function getContactList() {

                ExampleService.getContactList().then(function(data){

                        if (data.is_error == 1) {
                            job_roles.message_type = 'alert-danger';
                            job_roles.message = 'Cannot get contact lit!';
                        }
                        else {

                            // Pass the contact list to the scope
                            var contactList = [];
                            var contactListObject = {};

                            for (var i = 0; i < data.count; i++) {

                                // Build the contact list
                                contactList.push( {id: data.values[i]['id'], sort_name: data.values[i]['sort_name']} );
                                contactListObject[data.values[i]['id']] = { id: data.values[i]['id'], sort_name: data.values[i]['sort_name'] };
                            }

                            // Store the ContactList as Array as typeahead needs array what we can reuse later
                            job_roles.contactList = contactList;

                            // Store the object too, so we can point to right values by Contact ID
                            job_roles.contactListObject = contactListObject;

                            job_roles.message_type = 'alert-success';
                            job_roles.message = 'Contact list OK!';
                        }

                        // Hide the message after some seconds
                        $timeout(function() {
                            job_roles.message = null;
                        }, 3000);
                    },
                    function(errorMessage){
                        $scope.error = errorMessage;
                    });
            }

            function getOptionValues() {

                // Set the option groups for which we want to get the values
                var option_groups = ['hrjc_department', 'hrjc_region', 'hrjc_location', 'hrjc_level_type', 'cost_centres'];

                ExampleService.getOptionValues(option_groups).then(function(data) {

                        if (data.is_error == 1) {
                            job_roles.message_type = 'alert-danger';
                            job_roles.message = 'Cannot get option values!';
                        }
                        else {

                            // Pass the department option group list to the scope
                            var DepartmentList = {};

                            // Pass the region option group list to the scope
                            var RegionList = {};

                            // Pass the location option group list to the scope
                            var LocationList = {};

                            // Pass the level option group list to the scope
                            var LevelList = {};

                            // Pass the Cost Centers option group list to the scope
                            var CostCentreList = {};

                            angular.forEach(data['optionGroupData'], function (option_group_id, option_group_name) {

                                for (var i = 0; i < data.count; i++) {

                                    switch(option_group_name) {
                                        case 'hrjc_department':

                                            if (option_group_id == data.values[i]['option_group_id']) {
                                                // Build the department list
                                                DepartmentList[data.values[i]['id']] = { id: data.values[i]['id'], title: data.values[i]['label'] };
                                            }

                                            break;
                                        case 'hrjc_region':

                                            if (option_group_id == data.values[i]['option_group_id']) {
                                                // Build the region list
                                                RegionList[data.values[i]['id']] = { id: data.values[i]['id'], title: data.values[i]['label'] };

                                            }

                                            break;
                                        case 'hrjc_location':

                                            if (option_group_id == data.values[i]['option_group_id']) {
                                                // Build the contact list
                                                LocationList[data.values[i]['id']] = { id: data.values[i]['id'], title: data.values[i]['label'] };

                                            }

                                            break;
                                        case 'hrjc_level_type':

                                            if (option_group_id == data.values[i]['option_group_id']) {
                                                // Build the contact list
                                                LevelList[data.values[i]['id']] = { id: data.values[i]['id'], title: data.values[i]['label'] };

                                            }

                                            break;
                                        case 'cost_centres':

                                            if (option_group_id == data.values[i]['option_group_id']) {
                                                // Build the contact list
                                                CostCentreList[data.values[i]['id']] = { id: data.values[i]['id'], title: data.values[i]['label'] };

                                            }

                                            break;
                                    }



                                }

                            });

                            // Store the Department types what we can reuse later
                            job_roles.DepartmentsData = DepartmentList;

                            // Store the Region types what we can reuse later
                            job_roles.RegionsData = RegionList;

                            // Store the Location types what we can reuse later
                            job_roles.LocationsData = LocationList;

                            // Store the Level types what we can reuse later
                            job_roles.LevelsData = LevelList;

                            // Store the Level types what we can reuse later
                            $scope.CostCentreList = CostCentreList;
                            $log.info($scope.CostCentreList);

                            job_roles.message_type = 'alert-success';
                            job_roles.message = 'Option values list OK!';
                        }

                        // Hide the message after some seconds
                        $timeout(function() {
                            job_roles.message = null;
                        }, 3000);
                    },
                    function(errorMessage){
                        $scope.error = errorMessage;
                    });
            }

            // Implements the "getAllJobRoles" service
            function getJobRolesList(contact_id) {

                // Get the job contracts for the contact
                ExampleService.getContracts(contact_id).then(function(data) {

                        var job_contract_ids = [];
                        var contractsData = {};

                        // If we have job contracts, try to get the job roles for the contract
                        if (data.count != 0) {
                            for (var i = 0; i < data.count; i++) {

                                // Job contract IDs which will be passed to the "getAllJobRoles" service
                                job_contract_ids.push(data.values[i]['id']);

                                // Check the period end date
                                if (data.values[i]['period_end_date'] == undefined) {

                                    // No period end date defined (means contract is active)
                                    var status = '10';
                                }
                                else {

                                    // Get the current date
                                    var today = new Date();
                                    var period_end_date = new Date();

                                    var date_values = data.values[i]['period_end_date'].split("-");

                                    // Javascript calculates the months from 0 (so we use month - 1)
                                    period_end_date.setFullYear(date_values[0], date_values[1] - 1, date_values[2]);

                                    // If the period end date is in the future or today's date set the contract to active
                                    if (period_end_date >= today) {
                                        var status = '10';
                                    }
                                    else {
                                        var status = '20';
                                    }

                                }

                                contractsData[data.values[i]['id']] = {id: data.values[i]['id'], title: data.values[i]['title'], status: status};
                            }

                            // Store the ContractsData what we can reuse later
                            job_roles.contractsData = contractsData;

                            ExampleService.getAllJobRoles(job_contract_ids).then(function(data) {

                                    // Overwrite whatever status is stored in job roles table with the status based on the assigned job contract
                                    angular.forEach(data.values, function(object_data, key) {
                                        data.values[key]['status'] = job_roles.contractsData[object_data.job_contract_id].status;
                                    });

                                    // Assign data
                                    job_roles.getData = data.values;

                                    if (data.is_error == 1) {
                                        job_roles.status = 'Data load failure';
                                    }
                                    else {

                                        if (data.count == 0) {
                                            job_roles.empty = 'No Job Roles found!';
                                        }
                                        else {
                                            job_roles.empty = null;
                                        }

                                        job_roles.status = 'Data load OK';
                                    }
                                },
                                function(errorMessage){
                                    $scope.error = errorMessage;
                                });
                        }
                        else {
                            job_roles.empty = 'No Job Contracts found for this Contact!';
                        }


                    },
                    function(errorMessage){
                        $scope.error = errorMessage;
                    });

            }

            // Implements the "deleteJobRole" service
            function deleteJobRole(job_role_id) {

                ExampleService.deleteJobRole(job_role_id).then(function(data) {

                        if (data.is_error == 1) {
                            job_roles.message_type = 'alert-danger';
                            job_roles.message = 'Role delete failure!';
                        }
                        else {
                            job_roles.message_type = 'alert-success';
                            job_roles.message = 'Role deleted successfully!';
                        }

                        // Hide the message after some seconds
                        $timeout(function() {
                            job_roles.message = null;
                        }, 3000);
                    },
                    function(errorMessage){
                        $scope.error = errorMessage;
                    });

            }

            // Implements the "createJobRole" service
            function createJobRole(job_roles_data) {

                ExampleService.createJobRole(job_roles_data).then(function(data) {

                        if (data.is_error == 1) {
                            job_roles.message_type = 'alert-danger';
                            job_roles.message = 'Role creation failed!';
                        }
                        else {
                            job_roles.message_type = 'alert-success';
                            job_roles.message = 'Role added successfully!';
                        }

                        // Hide the message after some seconds
                        $timeout(function() {
                            job_roles.message = null;
                        }, 3000);
                    },
                    function(errorMessage){
                        $scope.error = errorMessage;
                    });

            }

            // Implements the "updateJobRole" service
            function updateJobRole(role_id, job_roles_data) {

                ExampleService.updateJobRole(role_id, job_roles_data).then(function(data){

                        if (data.is_error == 1) {
                            job_roles.message_type = 'alert-danger';
                            job_roles.message = 'Role update failed!';
                        }
                        else {
                            job_roles.message_type = 'alert-success';
                            job_roles.message = 'Role updated successfully!';
                        }

                        // Hide the message after some seconds
                        $timeout(function() {
                            job_roles.message = null;
                        }, 3000);
                    },
                    function(errorMessage){
                        $scope.error = errorMessage;
                    });

            }

        }]);
});
