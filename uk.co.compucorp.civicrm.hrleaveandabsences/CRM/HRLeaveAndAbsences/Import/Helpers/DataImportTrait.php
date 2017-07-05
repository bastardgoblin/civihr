<?php

use CRM_HRLeaveAndAbsences_BAO_LeaveRequest as LeaveRequest;
use CRM_HRLeaveAndAbsences_BAO_LeaveBalanceChange as LeaveBalanceChange ;

trait CRM_HRLeaveAndAbsences_Import_Helpers_DataImportTrait {

  /**
   * @var array
   *   Stores the type_id Balance change Option values.
   */
  private $balanceChangeTypes = [];

  /**
   * @var array
   *   Stores the date_type Leave request Option values.
   */
  private $dayTypes = [];

  /**
   * Returns the type_id Balance change Option values.
   *
   * @return array
   */
  private function getBalanceChangeTypes() {
    if (empty($this->balanceChangeTypes)) {
      $this->balanceChangeTypes = array_flip(LeaveBalanceChange::buildOptions('type_id', 'validate'));
    }

    return $this->balanceChangeTypes;
  }

  /**
   * Returns the date_type Leave request Option values.
   *
   * @return array
   */
  private function getDateTypes() {
    if (empty($this->dayTypes)) {
      $this->dayTypes = array_flip(LeaveRequest::buildOptions('from_date_type', 'validate'));
    }

    return $this->dayTypes;
  }

  /**
   * Creates a leave request from the params array.
   *
   * @param array $params
   *
   * @return LeaveRequest
   */
  private function createLeaveRequestFromImportData($params) {
    $startDate = new DateTime($params['start_date']);
    $endDate = new DateTime($params['end_date']);
    $dateTypes = $this->getDateTypes();

    $payload = [
      'contact_id' => $params['contact_id'],
      'type_id' => $params['type_id'],
      'status_id' => $params['status_id'],
      'request_type' => LeaveRequest::REQUEST_TYPE_LEAVE,
      'from_date' => $startDate->format('YmdHis'),
      'to_date' => $endDate->format('YmdHis'),
      'from_date_type' => $dateTypes['all_day'],
      'to_date_type' => $dateTypes['all_day']
    ];

    if (strpos($params['absence_type'], '(Credit)')) {
      $payload['request_type'] = LeaveRequest::REQUEST_TYPE_TOIL;
      $payload['toil_to_accrue'] = $params['total_qty'];
      $payload['toil_duration'] = 60;
    }

    if (strpos($params['absence_type'], 'Sick')) {
      $payload['request_type'] = LeaveRequest::REQUEST_TYPE_SICKNESS;
      $payload['sickness_reason'] = 1;
    }

    return LeaveRequest::create($payload);
  }

  /**
   * Creates the balance change for the absence date in Params array.
   *
   * @param array $params
   * @param CRM_HRLeaveAndAbsences_BAO_LeaveRequestDate $leaveDates
   */
  private function createBalanceChangeForLeaveDate($params, $leaveDates) {
    $absenceDate = new DateTime($params['absence_date']);
    $absenceDate = $absenceDate->format('Y-m-d');
    $balanceChangeTypes = $this->getBalanceChangeTypes();
    $balanceChangeType = $balanceChangeTypes['debit'];
    $amount = $params['qty'] * -1;

    if (strpos($params['absence_type'], '(Credit)')) {
      $balanceChangeType = $balanceChangeTypes['credit'];
      $amount = abs($amount);
    }

    foreach($leaveDates as $date) {
      if ($absenceDate == $date->date) {
        LeaveBalanceChange::create([
          'source_id' => $date->id,
          'source_type' => LeaveBalanceChange::SOURCE_LEAVE_REQUEST_DAY,
          'type_id' => $balanceChangeType,
          'amount' => $amount
        ]);
      }
    }
  }
}
