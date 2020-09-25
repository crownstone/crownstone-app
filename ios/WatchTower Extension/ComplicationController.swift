//
//  ComplicationController.swift
//  WatchTower Extension
//
//  Created by Alex de Mulder on 31/10/2018.
//  Copyright © 2018 Alex de Mulder. All rights reserved.
//

import ClockKit


class ComplicationController: NSObject, CLKComplicationDataSource {
    
    // MARK: - Timeline Configuration
    
    func getSupportedTimeTravelDirections(for complication: CLKComplication, withHandler handler: @escaping (CLKComplicationTimeTravelDirections) -> Void) {
        handler([.forward, .backward])
    }
    
    func getTimelineStartDate(for complication: CLKComplication, withHandler handler: @escaping (Date?) -> Void) {
        handler(nil)
    }
    
    func getTimelineEndDate(for complication: CLKComplication, withHandler handler: @escaping (Date?) -> Void) {
        handler(nil)
    }
    
    func getPrivacyBehavior(for complication: CLKComplication, withHandler handler: @escaping (CLKComplicationPrivacyBehavior) -> Void) {
        handler(.showOnLockScreen)
    }
    
    // MARK: - Timeline Population
    
    func getCurrentTimelineEntry(for complication: CLKComplication, withHandler handler: @escaping (CLKComplicationTimelineEntry?) -> Void) {
        // Call the handler with the current timeline entry
        handler(nil)
    }
    
    func getTimelineEntries(for complication: CLKComplication, before date: Date, limit: Int, withHandler handler: @escaping ([CLKComplicationTimelineEntry]?) -> Void) {
        // Call the handler with the timeline entries prior to the given date
        handler(nil)
    }
    
    func getTimelineEntries(for complication: CLKComplication, after date: Date, limit: Int, withHandler handler: @escaping ([CLKComplicationTimelineEntry]?) -> Void) {
        // Call the handler with the timeline entries after to the given date
        handler(nil)
    }
    
    // MARK: - Placeholder Templates
    
    func getLocalizableSampleTemplate(for complication: CLKComplication, withHandler handler: @escaping (CLKComplicationTemplate?) -> Void) {
        print("getLocalizableSampleTemplate", complication.family.rawValue)
        // This method will be called once per supported complication, and the results will be cached
        var template: CLKComplicationTemplate?
        switch complication.family {
        case .modularSmall:
            print("modularSmall")
            let graphicCornerTemplate = CLKComplicationTemplateModularSmallSimpleImage()
            let image = UIImage(named: "Complication/Modular")
            if let imageFound = image {
                let imageProvider = CLKImageProvider(onePieceImage: imageFound)
                graphicCornerTemplate.imageProvider = imageProvider
                template = graphicCornerTemplate
                print("loaded modularSmall")
            }
            else {
                print("failed to load modular small image")
                template = nil
            }
        case .utilitarianSmall:
            print("utilitarianSmall")
            template = nil
        case .utilitarianLarge:
            print("utilitarianLarge")
            template = nil
        case .circularSmall:
            print("circularSmall")
            let graphicCornerTemplate = CLKComplicationTemplateCircularSmallSimpleImage()
            let image = UIImage(named: "Complication/Circular")
            if let imageFound = image {
                let imageProvider = CLKImageProvider(onePieceImage: imageFound)
                graphicCornerTemplate.imageProvider = imageProvider
                template = graphicCornerTemplate
                print("loaded circularSmall")
            }
            else {
                print("failed to load circularSmall image")
                template = nil
            }
        case .modularLarge:
            print("modularLarge")
            template = nil
        case .utilitarianSmallFlat:
            print("utilitarianSmallFlat")
            template = nil
        case .extraLarge:
            print("extraLarge")
            template = nil
        case .graphicCorner:
            print("graphicCorner")
            let graphicCornerTemplate = CLKComplicationTemplateGraphicCornerTextImage()
            let image = UIImage(named: "Complication/Graphic Corner")
            if let imageFound = image {
                let imageProvider = CLKFullColorImageProvider(fullColorImage: imageFound)
                graphicCornerTemplate.imageProvider = imageProvider
                graphicCornerTemplate.textProvider = CLKSimpleTextProvider(text: "Crownstone")
                template = graphicCornerTemplate
                print("loaded graphicCorner")
            }
            else {
                print("failed to load graphicCorner image with text")
                template = nil
            }

//            print("graphicCorner")
//            let graphicCornerTemplate = CLKComplicationTemplateGraphicCornerCircularImage()
//            let image = UIImage(named: "Complication/Modular")
//
//            if let imageFound = image {
//                let imageProvider = CLKFullColorImageProvider(fullColorImage: imageFound)
//                graphicCornerTemplate.imageProvider = imageProvider
//                template = graphicCornerTemplate
//                print("loaded graphicCorner")
//            }
//            else {
//                print("failed to load graphicCorner image")
//                template = nil
//            }
        case .graphicBezel:
            print("graphicBezel")
            template = nil
        case .graphicCircular:
            print("graphicCircular")
            let graphicCornerTemplate = CLKComplicationTemplateGraphicCircularImage()
            let image = UIImage(named: "Complication/Graphic Circular")
            if let imageFound = image {
                let imageProvider = CLKFullColorImageProvider(fullColorImage: imageFound)
                graphicCornerTemplate.imageProvider = imageProvider
                template = graphicCornerTemplate
                print("loaded graphicCircular")
            }
            else {
                print("failed to load graphicCircular image")
                template = nil
            }
        case .graphicRectangular:
            print("graphicRectangular")
            template = nil
        case .graphicExtraLarge:
            template = nil
        }
        
        print("loading tamplate into the handler", template)
        handler(template)
    }
}
