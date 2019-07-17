//
//  JSONUtils.swift
//  SensePlatform
//
//  Created by Tatsuya Kaneko on 29/09/15.
//
//

import Foundation
import SwiftyJSON

public class JSONUtils {
    
    public static func stringify(_ value: AnyObject?)-> String {
        if value == nil {
            return ""
        }else{
            return self.stringify(JSON(value!))
        }
    }
    
    public static func stringify(_ json:JSON) -> String{
        return json.rawString(options: JSONSerialization.WritingOptions(rawValue: 0))!;
    }
    
    public static func jsonToData(_ json:JSON) throws -> Data{
        return try json.rawData();
    }
    
    static func getIntValue(_ jsonString: String) -> Int {
        return NSString(string: jsonString).integerValue
    }
    
    static func getDoubleValue(_ jsonString: String) -> Double {
        return NSString(string: jsonString).doubleValue
    }
    
    static func getBoolValue(_ jsonString: String) -> Bool {
        return NSString(string: jsonString).boolValue
    }
    
    static func getStringValue(_ jsonString: String) -> String{
        return self.unquote(jsonString)
    }
    
    static func getDictionaryValue(_ jsonString: String) -> [String: AnyObject]{
        if (jsonString.isEmpty){
            return [String: AnyObject]()
        }
        var result = [String: AnyObject]()
        if let data = jsonString.data(using: String.Encoding.utf8){
            do{
                if let dictionary = try JSONSerialization.jsonObject(with: data, options: JSONSerialization.ReadingOptions.mutableContainers) as? [String: AnyObject]{
                    result = dictionary
                }
            }catch {
                LOG.info("Error while parsing string into dictionary")
            }
        }
        return result
    }
    
    
    fileprivate static func getTypeFromDataStructure(_ structure: String) throws -> String {
        let data :Data = structure.data(using: String.Encoding.utf8)!
        let json :Dictionary = try JSONSerialization.jsonObject(with: data, options: .mutableContainers) as! [String:AnyObject]
        
        return json["type"] as! String
    }
    
    fileprivate static func isDouble(_ number: Double) -> Bool {
        return number != floor(number)
    }
    
    fileprivate static func quote(_ string: String) -> String {
        return String(format: "\"%@\"", string)
    }
    
    fileprivate static func unquote(_ string: String) -> String {
        return string.replacingOccurrences(of: "\"", with: "", options: NSString.CompareOptions.literal, range: nil)
    }
}
