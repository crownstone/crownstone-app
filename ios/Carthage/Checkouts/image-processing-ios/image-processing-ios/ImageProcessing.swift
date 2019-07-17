//
//  ImageProcessing.swift
//  image-processing-ios
//
//  Created by Alex de Mulder on 12/10/2018.
//  Copyright © 2018 Alex de Mulder. All rights reserved.
//

import Foundation
import CoreImage

public class ImageProcessing {
    
    /// This method will transform the image file in the bundle called <imageFilename>.png to a grayscale image
    /// and store it to <outputImageFilename>.png
    /// The factor of 0.0 will produce a grayscale image, the factor 1 will not change anything.
    ///
    /// Will return TRUE if everything was successful, will return FALSE, if it failed.
    public static func grayscale(imageFilename: String, outputImageFilename: String, factor: Double = 0.2) -> Bool {
        let fileURL = Bundle.main.url(forResource: imageFilename, withExtension: "png")
        
        // open source image
        let beginImage = CIImage(contentsOf: fileURL!)
        
        // create Filter for color controls
        let filter = CIFilter(name: "CIColorControls")
        filter!.setValue(beginImage, forKey: kCIInputImageKey)
        filter!.setValue(factor, forKey: kCIInputSaturationKey)
        
        // apply the transform to the image.
        let newImage = UIImage(ciImage: filter!.outputImage!)
        
        // store image
        let imagePath: String = "\(NSSearchPathForDirectoriesInDomains(.documentDirectory, .userDomainMask, true)[0])/\(outputImageFilename).png"
        let imageUrl: URL = URL(fileURLWithPath: imagePath)
        do {
            try newImage.pngData()?.write(to: imageUrl)
            return true
        }
        catch _ {
            return false
        }
    }
}
