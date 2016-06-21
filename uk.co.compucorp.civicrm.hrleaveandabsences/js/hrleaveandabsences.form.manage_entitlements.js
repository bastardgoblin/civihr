// Create the namespaces if they don't exist
CRM.HRLeaveAndAbsencesApp = CRM.HRLeaveAndAbsencesApp || {};
CRM.HRLeaveAndAbsencesApp.Form = CRM.HRLeaveAndAbsencesApp.Form || {};


/**
 * This class represents the whole ManageEntitlements form.
 *
 */
CRM.HRLeaveAndAbsencesApp.Form.ManageEntitlements = (function($) {

  /**
   * Creates a new ManageEntitlements form instance
   * @constructor
   */
  function ManageEntitlements() {
    this._filtersElement = $('.entitlement-calculation-filters');
    this._listElement = $('.entitlement-calculation-list');
    this._overrideFilter = this.OVERRIDE_FILTER_BOTH;
    this._setUpOverrideFilters();
    this._instantiateProposedEntitlements();
    this._addEventListeners();
  }

  //Constants for the Override Filter values
  ManageEntitlements.prototype.OVERRIDE_FILTER_OVERRIDDEN = 1;
  ManageEntitlements.prototype.OVERRIDE_FILTER_NON_OVERRIDDEN = 2;
  ManageEntitlements.prototype.OVERRIDE_FILTER_BOTH = 3;

  /**
   * Transforms the radios of the Override Filter into a jQuery UI button set
   *
   * @private
   */
  ManageEntitlements.prototype._setUpOverrideFilters = function() {
    this._filtersElement.find('.override-filters').buttonset();
  };

  /**
   * Creates new ProposedEntitlement instances for every calculation on the list
   *
   * @private
   */
  ManageEntitlements.prototype._instantiateProposedEntitlements = function() {
    this._listElement.find('.proposed-entitlement').each(function(i, element) {
      new CRM.HRLeaveAndAbsencesApp.Form.ManageEntitlements.ProposedEntitlement($(element));
    });
  };

  /**
   * Add event listeners to events triggered by elements of managed by this class
   *
   * @private
   */
  ManageEntitlements.prototype._addEventListeners = function() {
    this._filtersElement.find('.override-filter').on('change', this._onOverrideFilterChange.bind(this));
    this._listElement.find('tbody > tr').on('click', this._onListRowClick.bind(this));
  };

  /**
   * This is the event listener for when the value of the Override Filter changes.
   *
   * If the new value is different from the previous one, the list is updated to
   * reflect the option selected.
   *
   * @param {Object} event
   * @private
   */
  ManageEntitlements.prototype._onOverrideFilterChange = function(event) {
    var newOverrideFilterValue = parseInt(event.target.value);
    if(newOverrideFilterValue != this._overrideFilter) {
      this._overrideFilter = newOverrideFilterValue;
      this._updateList();
    }
  };

  /**
   * Updates the entitlements list to reflect the actual filter selection
   *
   * @private
   */
  ManageEntitlements.prototype._updateList = function() {
    switch(this._overrideFilter) {
      case this.OVERRIDE_FILTER_OVERRIDDEN:
        this._showOnlyOverridden();
        break;
      case this.OVERRIDE_FILTER_NON_OVERRIDDEN:
        this._showOnlyNonOverridden();
        break;
      default:
        this._showOverriddenAndNonOverridden();
        break;
    }
  };

  /**
   * Makes all the entitlements visible
   *
   * @private
   */
  ManageEntitlements.prototype._showOverriddenAndNonOverridden = function() {
    this._listElement.find('tr').show();
  };

  /**
   * Makes visible only the entitlements where the proposed entitlement was not overridden
   *
   * @private
   */
  ManageEntitlements.prototype._showOnlyOverridden = function() {
    this._showOverriddenAndNonOverridden();
    this._listElement.find('.proposed-entitlement .override-checkbox:not(:checked)').parents('tr').hide();
  };

  /**
   * Makes visible only the entitlements where the proposed entitlement was overridden
   *
   * @private
   */
  ManageEntitlements.prototype._showOnlyNonOverridden = function() {
    this._showOverriddenAndNonOverridden();
    this._listElement.find('.proposed-entitlement .override-checkbox:checked').parents('tr').hide();
  };

  /**
   * This is the event handler for when the user clicks on a row of the calculations
   * list.
   *
   * It shows the user a popup with details of the selected calculation. Even if the
   * proposed entitlement was overridden, we display the original calculation.
   *
   * @param event
   * @private
   */
  ManageEntitlements.prototype._onListRowClick = function(event) {
    var calculationDescription = ts('' +
      '((Base contractual entitlement + Public Holidays) ' +
      '* ' +
      '(No. of working days to work / No. of working days in period)) = ' +
      '(Period pro rata) + (Brought Forward days) = Period Entitlement'
    );
    var calculationDetails = event.currentTarget.dataset.calculationDetails;

    if(!calculationDetails) {
      return;
    }

    CRM.confirm({
      title: ts('Calculation details'),
      message: calculationDescription + '<br /><br />' + calculationDetails,
      width: '70%',
      options: {}
    });
  };

  return ManageEntitlements;

})($);


/**
 * This class wraps the small set of controls that each calculation on the ManageEntitlements
 * list has to allow the user to edit/override the proposed entitlement.
 */
CRM.HRLeaveAndAbsencesApp.Form.ManageEntitlements.ProposedEntitlement = (function($) {

  /**
   * Creates a new ProposedEntitlement instance
   *
   * @param {Object} element - The element wrapping all of the proposed entitlement controls
   * @constructor
   */
  function ProposedEntitlement(element) {
    this._overrideButton = element.find('button');
    this._overrideCheckbox = element.find('input[type="checkbox"]');
    this._overrideField = element.find('input[type="text"]');
    this._proposedValue = element.find('.proposed-value');
    this._addEventListeners();
  }

  /**
   * Add event listeners to the override button and the checkbox
   *
   * @private
   */
  ProposedEntitlement.prototype._addEventListeners = function() {
    this._overrideButton.on('click', this._onOverrideButtonClick.bind(this));
    this._overrideCheckbox.on('click', this._onOverrideCheckboxClick.bind(this));
  };

  /**
   * This is the event handler for when the override/edit button is clicked.
   *
   * It makes the field to override the proposed entitlement visible;
   *
   * @private
   */
  ProposedEntitlement.prototype._onOverrideButtonClick = function() {
    this._makeEntitlementEditable();
  };


  /**
   * This is the event handle for when the override checkbox is clicked.
   *
   * If it's checked, then we make the entitlement editable, by showing the
   * field to override the proposed entitlement. Otherwise, we hide the field
   * and display the edit button.
   *
   * @param event
   * @private
   */
  ProposedEntitlement.prototype._onOverrideCheckboxClick = function(event) {
    if(event.target.checked) {
      this._makeEntitlementEditable();
    } else {
      this._displayProposedEntitlementValue();
    }
  };

  /**
   * This make the proposed entitlement editable. That is, the field to override the
   * proposed value is displayed, the edit field, the edit button and the proposed
   * value is hidden, and the checkbox gets checked.
   *
   * @private
   */
  ProposedEntitlement.prototype._makeEntitlementEditable = function() {
    this._overrideButton.hide();
    this._proposedValue.hide();
    this._overrideField
      .val(this._proposedValue.text())
      .show()
      .focus();
    this._overrideCheckbox.prop('checked', true);
  };

  /**
   * This is used to hide the fields to override the entitlement, and display the original
   * proposed entitlement again.
   *
   * @private
   */
  ProposedEntitlement.prototype._displayProposedEntitlementValue = function() {
    this._overrideButton.show();
    this._proposedValue.show();
    this._overrideField
      .val('')
      .hide();
    this._overrideCheckbox.prop('checked', false);
  };

  return ProposedEntitlement;
})($);
