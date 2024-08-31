// set max property sise
const MAX_PROPERTIES_SIZE = 400000; // 400kB

function fetchEntries() {
  var scriptProperties = PropertiesService.getScriptProperties();
  
  //get desired acount numbers as a JSON array
  var DESIRED_ACCOUNT_NUMBERS = JSON.parse(scriptProperties.getProperty('DESIRED_ACCOUNT_NUMBERS'));
  //get firmaID for 
  var firmaID = parseInt(scriptProperties.getProperty('FirmaID'));
  Refresh_token(scriptProperties);

  // get acces token form Auth.gs
  const token = scriptProperties.getProperty('AUTH_TOKEN');

  // for each element in the array DESIRED_ACCOUNT_NUMBERS run this loop
  for (var i = 0; i < DESIRED_ACCOUNT_NUMBERS.length; i++) {
    // get account with index
    var account_number = DESIRED_ACCOUNT_NUMBERS[i]
    //get the data on the specific account
    data = fetchEntriesDataNew(token, account_number, firmaID)
    // get sheet and then current year
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var currentYear = new Date().getFullYear();
    
    for (var item of data){
      // set sheet name
      var sheetName = item.AccountName + ' ' + currentYear;
      // get the sheet
      var sheet = ss.getSheetByName(sheetName);
      var headers;
      //if sheet dosent exist create it 
        if (!sheet) {
        sheet = ss.insertSheet(sheetName);
        // Set headers
        headers = ["AccountNumber", "AccountName", "Date", "VoucherNumber", "VoucherType", "Description", "VatType", "VatCode", "Amount", "EntryGuid", "ContactGuid", "Type"];
        sheet.appendRow(headers);
        sheet.setFrozenRows(1);
      }
      else {
        // If sheet exists, get headers from row 1
        headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
      }

      // Collect rows to be added in an array
      var rowsToAdd = [];
      data.forEach(function (rowData) {
        if (!isDuplicate(sheet, rowData)) {
          Logger.log(rowData)
          var row = headers.map(function (header) {
            return rowData[header] || null;
          });
          Logger.log(row)
          // push row content to rowsToAdd array
          rowsToAdd.push(row);
        }
      });
      // Write all rows at once
      if (rowsToAdd.length > 0) {
        Logger.log(rowsToAdd)
        sheet.getRange(sheet.getLastRow() + 1, 1, rowsToAdd.length, headers.length).setValues(rowsToAdd);
      }
    }
}
}

function fetchEntriesData(token, account_number, firmaID) {
  const scriptProperties = PropertiesService.getScriptProperties();
  //get todays date then con vert it to yesterday and finaly change its format to fit with the dinero api
  var today = new Date()
  var yesterday = new Date(new Date().setDate(today.getDate() - 1))
  var yesterdayFormat = Utilities.formatDate(yesterday, 'Etc/GMT', 'yyyy-MM-dd')
  // get data from dinero from yesterday
  const response = UrlFetchApp.fetch(`https://api.dinero.dk/v1/${firmaID}/entries?fromDate=${yesterdayFormat}&toDate=${yesterdayFormat}`, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${token}`
    }
  });
    // parse string response into JSON object
    var json = JSON.parse(response.getContentText())
    var filteredJson = json.filter(function (item) {
    return [account_number].includes(item.AccountNumber);
    });
  if (parseInt(scriptProperties.getProperty('excessData_' + account_number)) > 0) {
    filteredJson = JSON.stringify(filteredJson).substring(parseInt(scriptProperties.getProperty('excessData_' + account_number))).trim();
    filteredJson = JSON.parse('[' + filteredJson.substring(0,filteredJson.length-1) + ']');
  }
  
  // convert filterd data into JSON then check its lenght against the max property size to check 
  var serializedData = JSON.stringify(filteredJson);

  if (serializedData.length > MAX_PROPERTIES_SIZE) {
    Logger.log('Over limit');
    // Split the data into two parts: one within the limit and the other exceeding the limit
    var dataWithinLimit = [];
    var excessData = [];
    var index = 0;

    while (index < filteredJson.length) {
      var tempData = dataWithinLimit.concat(filteredJson[index]);
      if (JSON.stringify(tempData).length <= MAX_PROPERTIES_SIZE) {
        dataWithinLimit = tempData;
        index++;
      } else {
        Logger.log(JSON.stringify(dataWithinLimit).length)
        break;
      }
    }

    excessData = filteredJson.slice(index);

    // Store the excess data in a script property
    var excessDataNumber = parseInt(scriptProperties.getProperty('excessData_' + account_number)) || 0;
    scriptProperties.setProperty('excessData_' + account_number, JSON.stringify(excessDataNumber + parseInt(JSON.stringify(dataWithinLimit).length)));
    // retun as much data as posible
    return dataWithinLimit;
  } else {
    Logger.log('Not over limit');
    var number = parseInt(account_number);
    number = number+1
    scriptProperties.deleteProperty('excessData_' + account_number);
    scriptProperties.setProperty('ACCOUNT_NUMBER', number);

    //retun all data
    return filteredJson;
  }
}

function isDuplicate(sheet, rowData) {
  var entryGuids = sheet.getRange("J2:J").getValues();

  for (var i = 0; i < entryGuids.length; i++) {
    if (entryGuids[i][0] === rowData.EntryGuid) {
      return true;
    }
  }
  return false;
}