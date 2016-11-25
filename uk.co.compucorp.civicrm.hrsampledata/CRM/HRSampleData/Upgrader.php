<?php

/**
 * Collection of upgrade steps.
 */
class CRM_HRSampleData_Upgrader extends CRM_HRSampleData_Upgrader_Base {

  private $csvDir;

  public function __construct($extensionName, $extensionDir) {
    parent::__construct($extensionName, $extensionDir);

    $this->csvDir = $this->extensionDir . "/resources/csv";
  }

  public function install() {
    $this->cleanTablesData();
    $this->importSampleData();
    $this->copyContactPhotos();
    $this->changeDefaultUsersAttachedContacts();
  }

  public function uninstall() {
    $this->cleanTablesData();
  }

  /**
   * Removes data from Specific tables
   */
  private function cleanTablesData() {
    $this->executeSqlFile('sql/uninstall.sql');
    $this->cleanCustomFieldsValues();
    $this->cleanSampleDataValues();
  }

  /**
   * Custom field values data need to be cleaned
   * differently by getting all custom field tables
   * from custom groups table and then cleaning
   * each table one by one.
   */
  private function cleanCustomFieldsValues() {
    $customFieldTables = civicrm_api3('CustomGroup', 'get', [
      'sequential' => 1,
      'table_name' => ['IS NOT NULL' => 1],
      'return' => ['table_name'],
      'options' => ['limit' => 0],
    ])['values'];

    foreach ($customFieldTables as $table) {
      CRM_Core_DAO::executeQuery("TRUNCATE TABLE {$table['table_name']}");
    }
  }

  /**
   * Data such as option values, pay scales .. etc
   * which are created by this extension are cleaned here.
   */
  private function cleanSampleDataValues() {
    $filesToClean = [
      'AbsenceType' => 'civicrm_hrabsence_type',
      'HRHoursLocation' => 'civicrm_hrhours_location',
      'HRPayScale' => 'civicrm_hrpay_scale',
      'LocationType' => 'civicrm_location_type',
      'OptionValue' => 'civicrm_option_value',
      'PhotoFilesCleaner' => 'civicrm_contact',
    ];

    foreach($filesToClean as $class => $file) {
      $fileToClean = new SplFileObject("{$this->csvDir}/{$file}.csv");
      $processor = new CRM_HRSampleData_CSVProcessor($fileToClean);

      $cleanerClassName = "CRM_HRSampleData_Cleaner_{$class}";
      $dataCleaner = new $cleanerClassName();

      $processor->process($dataCleaner);
    }
  }

  /**
   * Imports CiviHR sample data
   */
  private function importSampleData() {
    // These files will be imported in order
    $csvFiles  = [
      'OptionValue' => 'civicrm_option_value',
      'LocationType' => 'civicrm_location_type',
      'Contact' => 'civicrm_contact',
      'ContactEmail' => 'civicrm_email',
      'ContactPhone' => 'civicrm_phone',
      'ContactAddress' => 'civicrm_address',
      'Relationships' => 'civicrm_relationship',
      'HRHoursLocation' => 'civicrm_hrhours_location',
      'HRPayScale' => 'civicrm_hrpay_scale',
      'AbsencePeriod' => 'civicrm_hrabsence_period',
      'AbsenceType' => 'civicrm_hrabsence_type',
      'Vacancy' => 'civicrm_hrvacancy',
      'VacancyStage' => 'civicrm_hrvacancy_stage',
      'JobContract' => 'civicrm_hrjobcontract',
      'JobRoles' => 'civicrm_hrjobroles',
      'Activity' => 'civicrm_activity',
      'BankDetails' => 'civicrm_value_bank_details',
      'EmergencyContacts' => 'civicrm_value_emergency_contacts',
      'ExtendedDemographics' => 'civicrm_value_extended_demographics',
    ];

    foreach($csvFiles as $class => $file) {
      $fileToImport = new SplFileObject("{$this->csvDir}/{$file}.csv");
      $processor = new CRM_HRSampleData_CSVProcessor($fileToImport);

      $importerClassName = "CRM_HRSampleData_Importer_{$class}";
      $importer = new $importerClassName();

      $processor->process($importer);
    }
  }

  /**
   * Copies photos to the public CiviCRM directory
   */
  private function copyContactPhotos() {
    $imgDir = $this->extensionDir . "/resources/photos/";

    $config = CRM_Core_Config::singleton();
    $uploadDir= $config->customFileUploadDir;

    $copier = new CRM_HRSampleData_FileCopier();
    $copier->recurseCopy($imgDir, $uploadDir);
  }

  /**
   * Changes Default Users ( civihr_admin , civihr_manager .. etc) attached
   * contacts to different ones but with more data.
   */
  private function changeDefaultUsersAttachedContacts() {
    $usersToNewContacts = [
      'civihr_admin@compucorp.co.uk' => 'jake@sccs.org',
      'civihr_manager@compucorp.co.uk' => 'adam@sccs.org',
      'civihr_staff@compucorp.co.uk' => 'zoe@sccs.org',
    ];

    foreach($usersToNewContacts as $ufName => $newContactEmail) {
      $userRecord = civicrm_api3('UFMatch', 'get', [
        'sequential' => 1,
        'uf_name' => $ufName,
      ]);

      if (!empty($userRecord['values'])) {
        $userRecord = array_shift($userRecord['values']);

        $this->updateUFMatchContact($userRecord['id'], $newContactEmail);
        $this->updateCMSUserEmail($userRecord['uf_id'], $newContactEmail);
        $this->deleteContact($userRecord['contact_id']);
      }

    }
  }

  /**
   * Updates UFMatch attached contact given the record
   * ID and the new contact email.
   *
   * @param int $ufmatchID
   * @param string $newContactEmail
   */
  private function updateUFMatchContact($ufmatchID, $newContactEmail) {
    $newContact = civicrm_api3('Email', 'get', [
      'sequential' => 1,
      'return' => ['email', 'contact_id'],
      'email' => $newContactEmail,
    ]);

    if (!empty($newContact['values'])) {
      $newContact = array_shift($newContact['values']);
      $currentDomainID = $this->getCurrentDomainID();

      civicrm_api3('UFMatch', 'create', [
        'id' => $ufmatchID,
        'uf_name' => $newContact['email'],
        'contact_id' => $newContact['contact_id'],
        'domain_id' => $currentDomainID,
      ]);
    }
  }

  /**
   * Updates user email on the CMS side.
   * (Currently Supports Drupal 7 CMS Only)
   *
   * @param int $cmsID
   * @param string $newEmail
   */
  private function updateCMSUserEmail($cmsID, $newEmail) {
    $existingUser = user_load($cmsID);

    // save new user email
    user_save($existingUser, ['mail' => $newEmail]);
  }

  /**
   * Deletes contact by ID
   *
   * @param int $id
   */
  private function deleteContact($id) {
    civicrm_api3('Contact', 'delete', [
      'id' => $id,
    ]);
  }

  /**
   * Gets current domain ID
   */
  private function getCurrentDomainID() {
    $domain = civicrm_api3('Domain', 'get', [
      'sequential' => 1,
      'return' => ['id'],
      'current_domain' => 1,
    ]);

    return $domain['id'];
  }

}
