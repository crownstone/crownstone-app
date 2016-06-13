//
//  JSONUtils.swift
//  SensePlatform
//
//  Created by Tatsuya Kaneko on 29/09/15.
//
//

import Foundation
import SwiftyJSON

public class JSONUtils{
  
  public static func stringify(value: AnyObject?)-> String {
    if value == nil {
      return ""
    }else{
      return self.stringify(JSON(value!))
    }
  }
  
  public static func stringify(json:JSON) -> String{
    return json.rawString(options: NSJSONWritingOptions(rawValue: 0))!;
  }
  
  public static func jsonToData(json:JSON) throws -> NSData{
    return try json.rawData();
  }
  
  static func getIntValue(jsonString: String) -> Int {
    return NSString(string: jsonString).integerValue
  }
  
  static func getDoubleValue(jsonString: String) -> Double {
    return NSString(string: jsonString).doubleValue
  }
  
  static func getBoolValue(jsonString: String) -> Bool {
    return NSString(string: jsonString).boolValue
  }
  
  static func getStringValue(jsonString: String) -> String{
    return self.unquote(jsonString)
  }
  
  static func getDictionaryValue(jsonString: String) -> [String: AnyObject]{
    if (jsonString.isEmpty){
      return [String: AnyObject]()
    }
    var result = [String: AnyObject]()
    if let data = jsonString.dataUsingEncoding(NSUTF8StringEncoding){
      do{
        if let dictionary = try NSJSONSerialization.JSONObjectWithData(data, options: NSJSONReadingOptions.MutableContainers) as? [String: AnyObject]{
          result = dictionary
        }
      }catch {
        print("Error while parsing string into dictionary")
      }
    }
    return result
  }
  
  
  private static func getTypeFromDataStructure(structure: String) throws -> String {
    let data :NSData = structure.dataUsingEncoding(NSUTF8StringEncoding)!
    let json :Dictionary = try NSJSONSerialization.JSONObjectWithData(data, options: .MutableContainers) as! [String:AnyObject]
    
    return json["type"] as! String
  }
  
  private static func isDouble(number: Double) -> Bool {
    return number != floor(number)
  }
  
  private static func quote(string: String) -> String {
    return String(format: "\"%@\"", string)
  }
  
  private static func unquote(string: String) -> String {
    return string.stringByReplacingOccurrencesOfString("\"", withString: "", options: NSStringCompareOptions.LiteralSearch, range: nil)
  }
}