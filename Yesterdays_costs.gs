function saveYesterdaysCost() {
  var year = parseInt(new Date().getFullYear()).toFixed(0);
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(`sheetName ${year}`);

  // Gets the date
  var date = sheet.getRange("C3:C3").getDisplayValue();

  //get data for facebook and google
  //data is inserted into sheet daily via Adveronix or a simmilare add on
  var googleData = sheet.getRange("A3:C4").getValues();
  var facebookData = sheet.getRange("E3:G4").getValues();

  //loop through them to make sure that the data is insertet correcly
  Logger.log(googleData)
  for (data of googleData){
    if (data[0] === "Denmark"){
      var googleCostDK = data[1]
    }else if (data[0] === "Germany"){
      var googleCostDE = data[1]
    }
  }

  Logger.log(facebookData)
  for (data of facebookData){
    if (data[0] === "Denmark"){
      var facebookCostDK = data[1]
    }else if (data[0] === "Germany"){
      var facebookCostDE = data[1]
    }
  }

  var lastRow = sheet.getLastRow();
  // Google
  sheet.getRange(lastRow + 1, 1).setValue(date); // Set date in the first column of the new last row
  sheet.getRange(lastRow + 1, 2).setValue(googleCostDK); // Set googleCost in the second column of the new last row
  sheet.getRange(lastRow + 1, 3).setValue(googleCostDE); // Set googleCost in the second column of the new last row

  // Facebook
  sheet.getRange(lastRow + 1, 4).setValue(date); // Set date in the first column of the new last row
  sheet.getRange(lastRow + 1, 5).setValue(facebookCostDK); // Set facebookCost in the second column of the new last row
  sheet.getRange(lastRow + 1, 6).setValue(facebookCostDE); // Set facebookCost in the second column of the new last row
}