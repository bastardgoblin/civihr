<?php

use CRM_HRCore_Test_Fabricator_OptionValue as OptionValueFabricator;

/**
 * Class CRM_HRSampleData_Importer_VacancyTest
 *
 * @group headless
 */
class CRM_HRSampleData_CSVProcessor_VacancyTest extends CRM_HRSampleData_BaseCSVProcessorTest {

  private $locationOption;

  public function setUp() {
    $this->rows = [];
    $this->rows[] = $this->importHeadersFixture();

    $this->locationOption = OptionValueFabricator::fabricate(['option_group_id' => 'hrjc_location']);
  }

  public function testProcess() {
    $this->rows[] = [
      2,
      25000,
      'Junior Programme Coordinator',
      'Test Desc',
      'Test Ben',
      'Test Req',
      $this->locationOption['name'],
      0,
      'Open',
      '2016-09-01 00:00:00',
      '2016-09-30 00:00:00',
    ];

    $this->runProcessor('CRM_HRSampleData_Importer_Vacancy', $this->rows);

    $vacancy = $this->apiGet('HRVacancy', ['position' => 'Junior Programme Coordinator']);

    foreach($this->rows[0] as $index => $fieldName) {
      if (!in_array($fieldName, ['id', 'location', 'status_id'])) {
        $this->assertEquals($this->rows[1][$index], $vacancy[$fieldName]);
      }
    }
  }

  private function importHeadersFixture() {
    return [
      'id',
      'salary',
      'position',
      'description',
      'benefits',
      'requirements',
      'location',
      'is_template',
      'status_id',
      'start_date',
      'end_date',
    ];
  }

}
