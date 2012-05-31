//  PRGViewController.m
//  Cryptogram
//  Author: tierney@cs.nyu.edu (Matt Tierney)
//
//  Based on the following:
//
//  ABSViewController.m
//  AddressBookSpy
//
//  Created by Johannes Fahrenkrug on 27.02.12.
//  Copyright (c) 2012 Springenwerk. All rights reserved.
//

#import "PRGViewController.h"
#import "QSUtilities.h"
#import "HashValue.h"
#import <Foundation/NSJSONSerialization.h>
#include <CommonCrypto/CommonDigest.h>
#include "GLKit/GLKMath.h"
#import <MessageUI/MessageUI.h>
#import <MobileCoreServices/UTType.h>


#define BARBUTTON(TITLE, SELECTOR) 	[[UIBarButtonItem alloc] initWithTitle:TITLE style:UIBarButtonItemStylePlain target:self action:SELECTOR]
#define IS_IPHONE (UI_USER_INTERFACE_IDIOM() == UIUserInterfaceIdiomPhone)
#define RESIZABLE(_VIEW_)   [_VIEW_ setAutoresizingMask:UIViewAutoresizingFlexibleHeight | UIViewAutoresizingFlexibleWidth]

CGPoint CGRectGetCenter(CGRect rect)
{
    CGPoint pt;
    pt.x = CGRectGetMidX(rect);
    pt.y = CGRectGetMidY(rect);
    return pt;
}

@implementation PRGViewController
@synthesize engine=_engine, searchTermField=_searchTermField, resultLabel=_resultLabel,
            imagePickerController=_imagePickerController, editSwitch=_editSwitch,
            imageView=_imageView;

- (id)initWithNibName:(NSString *)nibNameOrNil bundle:(NSBundle *)nibBundleOrNil 
{
    self = [super initWithNibName:nibNameOrNil bundle:nibBundleOrNil];
    if (self) {
        self.engine = [[PRGEngine alloc] init];
    }
    return self;
}

- (void) viewDidAppear:(BOOL)animated
{
    self.imageView.frame = self.view.bounds;
    self.imageView.center = CGRectGetCenter(self.view.bounds);
}

+ (UIImage*)imageWithImage:(UIImage*)sourceImage scaledToSizeWithSameAspectRatio:(CGSize)targetSize;
{  
    CGSize imageSize = sourceImage.size;
    CGFloat width = imageSize.width;
    CGFloat height = imageSize.height;
    CGFloat targetWidth = targetSize.width;
    CGFloat targetHeight = targetSize.height;
    CGFloat scaleFactor = 0.0;
    CGFloat scaledWidth = targetWidth;
    CGFloat scaledHeight = targetHeight;
    CGPoint thumbnailPoint = CGPointMake(0.0,0.0);
    
    if (CGSizeEqualToSize(imageSize, targetSize) == NO) {
        CGFloat widthFactor = targetWidth / width;
        CGFloat heightFactor = targetHeight / height;
        
        if (widthFactor > heightFactor) {
            scaleFactor = widthFactor; // scale to fit height
        } else {
            scaleFactor = heightFactor; // scale to fit width
        }
        
        scaledWidth  = width * scaleFactor;
        scaledHeight = height * scaleFactor;
        
        // center the image
        if (widthFactor > heightFactor) {
            thumbnailPoint.y = (targetHeight - scaledHeight) * 0.5; 
        } else if (widthFactor < heightFactor) {
            thumbnailPoint.x = (targetWidth - scaledWidth) * 0.5;
        }
    }     
    
    CGImageRef imageRef = [sourceImage CGImage];
    CGBitmapInfo bitmapInfo = CGImageGetBitmapInfo(imageRef);
    CGColorSpaceRef colorSpaceInfo = CGImageGetColorSpace(imageRef);
    
    if (bitmapInfo == kCGImageAlphaNone) {
        bitmapInfo = kCGImageAlphaNoneSkipLast;
    }
    
    CGContextRef bitmap;
    
    if (sourceImage.imageOrientation == UIImageOrientationUp || sourceImage.imageOrientation == UIImageOrientationDown) {
        bitmap = CGBitmapContextCreate(NULL, targetWidth, targetHeight, CGImageGetBitsPerComponent(imageRef), CGImageGetBytesPerRow(imageRef), colorSpaceInfo, bitmapInfo);
    } else {
        bitmap = CGBitmapContextCreate(NULL, targetHeight, targetWidth, CGImageGetBitsPerComponent(imageRef), CGImageGetBytesPerRow(imageRef), colorSpaceInfo, bitmapInfo);
    }   
    
    // In the right or left cases, we need to switch scaledWidth and scaledHeight,
    // and also the thumbnail point
    if (sourceImage.imageOrientation == UIImageOrientationLeft) {
        thumbnailPoint = CGPointMake(thumbnailPoint.y, thumbnailPoint.x);
        CGFloat oldScaledWidth = scaledWidth;
        scaledWidth = scaledHeight;
        scaledHeight = oldScaledWidth;
        
        CGContextRotateCTM (bitmap, GLKMathDegreesToRadians(90.0));
        CGContextTranslateCTM (bitmap, 0, -targetHeight);
        
    } else if (sourceImage.imageOrientation == UIImageOrientationRight) {
        thumbnailPoint = CGPointMake(thumbnailPoint.y, thumbnailPoint.x);
        CGFloat oldScaledWidth = scaledWidth;
        scaledWidth = scaledHeight;
        scaledHeight = oldScaledWidth;
        
        CGContextRotateCTM (bitmap, GLKMathDegreesToRadians(90.0));
        CGContextTranslateCTM (bitmap, -targetWidth, 0);
        
    } else if (sourceImage.imageOrientation == UIImageOrientationUp) {
        // NOTHING
    } else if (sourceImage.imageOrientation == UIImageOrientationDown) {
        CGContextTranslateCTM (bitmap, targetWidth, targetHeight);
        CGContextRotateCTM (bitmap, GLKMathDegreesToRadians(-180.0));
    }
    
    CGContextDrawImage(bitmap, CGRectMake(thumbnailPoint.x, thumbnailPoint.y, scaledWidth, scaledHeight), imageRef);
    CGImageRef ref = CGBitmapContextCreateImage(bitmap);
    UIImage* newImage = [UIImage imageWithCGImage:ref];
    
    CGContextRelease(bitmap);
    CGImageRelease(ref);
    
    return newImage; 
}

- (NSString *) mimeTypeForExtension: (NSString *) ext 
{
    // Request the UTI via the file extension 
    CFStringRef UTI = UTTypeCreatePreferredIdentifierForTag(kUTTagClassFilenameExtension, (__bridge CFStringRef) ext, NULL);
    if (!UTI) return nil;
    
    // Request the MIME file type via the UTI, 
    // may return nil for unrecognized MIME types
    
    NSString *mimeType = (__bridge_transfer NSString *) UTTypeCopyPreferredTagWithClass(UTI, kUTTagClassMIMEType);
    
    return mimeType;
}

- (void)mailComposeController:(MFMailComposeViewController*)controller
          didFinishWithResult:(MFMailComposeResult)result
                        error:(NSError*)error
{
    // Dismiss the e-mail controller once the user is done
    [self dismissModalViewControllerAnimated:YES];
    
    if (self.imagePickerController) 
        self.imagePickerController = nil;
}

- (void) emailImage: (UIImage *) image
{
    if (![MFMailComposeViewController canSendMail])
    {
        if (IS_IPHONE)
        {
            [self dismissModalViewControllerAnimated:YES];
            self.imagePickerController = nil;
        }
        return;
    }
    
    
    // Customize the e-mail
    MFMailComposeViewController *mcvc = [[MFMailComposeViewController alloc] init];
    mcvc.mailComposeDelegate = self;
    [mcvc setSubject:@"Here’s a great photo!"];
    NSString *body = @"<h1>Check this out</h1>\
    <p>I selected this image from the\
    <code><b>UIImagePickerController</b></code>.</p>";
    [mcvc setSubject:@"Cryptogram iOS Photos!"];
    [mcvc setMessageBody:body isHTML:YES];
    [mcvc addAttachmentData:UIImageJPEGRepresentation(image, 1.0f)
                   mimeType:@"image/jpeg" fileName:@"cryptogram.jpg"];
    
    // Present the e-mail composition controller
    if (IS_IPHONE)
        [self.imagePickerController presentModalViewController:mcvc animated:YES];
    else
    {
        [self.popoverController dismissPopoverAnimated:NO];
        mcvc.modalTransitionStyle = UIModalTransitionStyleFlipHorizontal;
        mcvc.modalPresentationStyle = UIModalPresentationFormSheet;
        [self presentModalViewController:mcvc animated:YES];
    }
}

- (int) octToGray:(unichar *)given_oct_val
{
    const NSArray *thresholds = [NSArray arrayWithObjects: 
                                 [NSNumber numberWithInt:238],
                                 [NSNumber numberWithInt:210],
                                 [NSNumber numberWithInt:182],
                                 [NSNumber numberWithInt:154],
                                 [NSNumber numberWithInt:126],
                                 [NSNumber numberWithInt:98],
                                 [NSNumber numberWithInt:70],
                                 [NSNumber numberWithInt:42],
                                 [NSNumber numberWithInt:14],
                                 nil];
    
    NSString *oct_val = [NSString stringWithCharacters:given_oct_val length:1];
    NSNumber *value = [NSNumber numberWithInt:[oct_val intValue]];
    int gray_value = [[thresholds objectAtIndex:[value intValue]] intValue];
    return gray_value;
}
const float kRedColor[] = { 1.0, 0.0, 0.0, 1.0}; 
const int SYMBOL_HEIGHT = 2;
const int SYMBOL_WIDTH = 4;

// Update image and for iPhone, dismiss the controller
- (void)imagePickerController:(UIImagePickerController *)picker didFinishPickingMediaWithInfo:(NSDictionary *)info
{
    CGFloat DIMENSION_LIMIT = 2048;
    UIImage *image = [info objectForKey:UIImagePickerControllerEditedImage];
    if (!image) {
        image = [info objectForKey:UIImagePickerControllerOriginalImage];
    }
    CGSize image_size = image.size;
    CGFloat width = image_size.width;
    CGFloat height = image_size.height;
    CGFloat _width_height_ratio = width / height;
    NSLog(@"Aspect ratio: %.2f.", _width_height_ratio);

    
    int iteration = 0;
    NSData *jpeg_data = nil;
    while (YES) {
        jpeg_data = UIImageJPEGRepresentation(image, 0.72);
        long estimated_length = [jpeg_data length] * pow(1.334, 2);
        if (estimated_length * 8 < DIMENSION_LIMIT * DIMENSION_LIMIT) {
            break;
        }
        // Must reduce size of image.
        iteration++;
        NSLog(@"Iteration %d. width: %.2f. height: %.2f.", iteration, image.size.width, image.size.height);
        image = [PRGViewController imageWithImage:image 
                  scaledToSizeWithSameAspectRatio:CGSizeMake(width * (1 - (0.15 * iteration)), 
                                                             height * (1 - (0.15 * iteration)))];
    }
    // Image dimensions to process.
    width = image.size.width;
    height = image.size.height;
    
    NSLog(@"jpeg_data length: %ld", (long)[jpeg_data length]);
    
    NSString *base64_image = [QSStrings encodeBase64WithData:jpeg_data];
    NSLog(@"Length: %ld.", (long)[base64_image length]);
    
    NSLog(@"image %@.", [base64_image substringToIndex:25]);
    
    NSString *to_encrypt = [self cryptogramEncrypt:@"cryptogram" :base64_image];
    
    NSString *octal_string = [PRGUtilities base64Octify:to_encrypt];
    NSLog(@"To Encrypt: %@.", [to_encrypt substringToIndex:100]);
    
    
    NSString *header_values = [NSString stringWithFormat:@"%s", "aesthete"];
    NSString *header_oct_values = [PRGUtilities base64Octify:header_values];
    
    const int N_HEADER_VALUES = [header_oct_values length];
    int n_header_values_in_row = (int)ceil(sqrt(N_HEADER_VALUES));
    if (n_header_values_in_row % 2 != 0) { 
        n_header_values_in_row++; 
    }
    NSLog(@"n_header_values_in_row: %d.", n_header_values_in_row);
    
    int data_len = ([header_values length] + [to_encrypt length]);
    double num_symbols_wide = pow(_width_height_ratio * SYMBOL_HEIGHT * data_len / SYMBOL_WIDTH, 0.5);
    double num_symbols_high = data_len / num_symbols_wide;
    NSLog(@"SYMS W %.2f H %.2f data_len %d", num_symbols_wide, num_symbols_high, data_len);
    
    int sym_height = (int)ceil(num_symbols_high);
    int sym_width = (int)ceil(num_symbols_wide);
    
    int new_height = SYMBOL_HEIGHT * sym_height;
    int new_width = SYMBOL_WIDTH * sym_width;
    if (new_width / (float)new_height > _width_height_ratio) {
        double _desired_height = new_width / _width_height_ratio;
        int symbol_rows_to_add = (_desired_height - new_height) / SYMBOL_HEIGHT;
        NSLog(@"symbol_rows_to_add %d.", symbol_rows_to_add);
        sym_height = sym_height + symbol_rows_to_add;
        new_height = SYMBOL_HEIGHT * sym_height;
    }
    num_symbols_wide = sym_width;
    num_symbols_high = sym_height;
    NSLog(@"Desktop: width %d height %d sym_width %d sym_height %d.", new_width,
          new_height, sym_width, sym_height);
    
    // TODO(tierney): Create the Cryptogram image.
    UIImage *cryptogram_image = nil;
    UIGraphicsBeginImageContextWithOptions(CGSizeMake(new_width, new_height), NO, 0.0f);
    CGContextRef context = UIGraphicsGetCurrentContext();

    // Initialize everything to black.
    CGContextSetGrayFillColor(context, 0.0, 1.0);
    CGContextFillRect(context, CGRectMake(0, 0, new_width, new_height));

    // Working header writer.
    for (int header_idx = 0; header_idx < [header_values length]; header_idx++) {
        unichar oct0 = [header_oct_values characterAtIndex:2 * header_idx];
        int fill0 = [self octToGray:&oct0];
        unichar oct1 = [header_oct_values characterAtIndex:(2 * header_idx) + 1];
        int fill1 = [self octToGray:&oct1];
        
        int y_coord = header_idx / 2.0;
        int x_coord = header_idx - (y_coord * 2.0);
        int base_x = x_coord * 4;
        int base_y = y_coord * 2;
        
        CGContextSetGrayFillColor(context, fill0 / 256.0, 1.0);
        CGContextFillRect(context, CGRectMake(base_x, base_y, 2.0f, 2.0f));

        CGContextSetGrayFillColor(context, fill1 / 256.0, 1.0);
        CGContextFillRect(context, CGRectMake(base_x + 2, base_y, 2.0f, 2.0f));
    }    
    
    int n_header_row_symbols_wide = (new_width - 8) / 4;
    int n_header_row_symbols = n_header_row_symbols_wide * (8 / SYMBOL_HEIGHT);
    NSLog(@"n_header_row_symbols: %d.", n_header_row_symbols);

    int new_image_num_symbols_wide = new_width / 4;
    int y_coord, x_coord, base_x, base_y, i_;
    int encrypt_len = [to_encrypt length];
    for (int i = 0; i < encrypt_len; i++) {
        unichar oct0 = [octal_string characterAtIndex:2 * i];
        int fill0 = [self octToGray:&oct0];
        unichar oct1 = [octal_string characterAtIndex:(2 * i) + 1];
        int fill1 = [self octToGray:&oct1];
        
        if (i < n_header_row_symbols) {
            y_coord = i / n_header_row_symbols_wide;
            x_coord = (i - (y_coord * n_header_row_symbols_wide));
            base_x = 8 + (x_coord * 4);
        } else {
            i_ = i + 8;
            y_coord = i_ / new_image_num_symbols_wide;
            x_coord = i_ - (y_coord * new_image_num_symbols_wide);
            base_x = x_coord * 4;
        }
        base_y = y_coord * 2;
     
        CGContextSetGrayFillColor(context, fill0 / 256.0, 1.0);
        CGContextFillRect(context, CGRectMake(base_x, base_y, 2.0f, 2.0f));
        
        CGContextSetGrayFillColor(context, fill1 / 256.0, 1.0);
        CGContextFillRect(context, CGRectMake(base_x + 2, base_y, 2.0f, 2.0f));
        if (encrypt_len - i < 20) {
            NSLog(@"last values written: %d, %d", base_x, base_y);            
        }
    }
    
    cryptogram_image = UIGraphicsGetImageFromCurrentImageContext();
    UIGraphicsEndImageContext();
    NSLog(@"Image specs: %.2f %.2f.", cryptogram_image.size.width, cryptogram_image.size.height);
    // UIImageWriteToSavedPhotosAlbum(cryptogram_image, self, @selector(image:didFinishSavingWithError:contextInfo:), nil);
    
    self.imageView.image = cryptogram_image;
    [self emailImage:cryptogram_image];
    
	if (IS_IPHONE)
	{
        [self dismissModalViewControllerAnimated:YES];
        self.imagePickerController = nil;
	}
}

- (void)image:(UIImage *)image didFinishSavingWithError: (NSError *)error contextInfo:(void *)contextInfo;
{
    // Handle the end of the image write process
    if (!error)
        NSLog(@"Image written to photo album");
    else
        NSLog(@"Error writing to photo album: %@", [error localizedDescription]);
}

- (NSString *) cryptogramEncrypt: (NSString *)password: (NSString *)base64_image {
    NSString *sjcl_command = [NSString 
                              stringWithFormat:@"sjcl.encrypt(\"%@\", \"%@\");",
                              password, base64_image];
    
    NSLog(@"About to encrypt.");
    NSData *encrypted_result = [[self.engine runJS:sjcl_command] 
                                dataUsingEncoding:NSUTF8StringEncoding];
    NSDictionary *encrypted_data = [NSJSONSerialization 
                                    JSONObjectWithData:encrypted_result 
                                    options:kNilOptions error:nil];
    
    NSString *to_hash = [NSString stringWithFormat:@"%@%@%@", 
                         [encrypted_data objectForKey:@"iv"],
                         [encrypted_data objectForKey:@"salt"],
                         [encrypted_data objectForKey:@"ct"]];
    
    HashValue *data_to_hash = [HashValue sha256HashWithData:[to_hash dataUsingEncoding:NSUTF8StringEncoding]];
    NSString *integrity_check_value = [data_to_hash description];
    
    NSString *to_encrypt = [NSString stringWithFormat:@"%@%@%@%@",
                            integrity_check_value,
                            [encrypted_data objectForKey:@"iv"],
                            [encrypted_data objectForKey:@"salt"],
                            [encrypted_data objectForKey:@"ct"]];
    return to_encrypt;
}

// Dismiss picker
- (void) imagePickerControllerDidCancel: (UIImagePickerController *)picker
{
    [self dismissModalViewControllerAnimated:YES];
    self.imagePickerController = nil;
}

// Popover was dismissed
- (void)popoverControllerDidDismissPopover:(UIPopoverController *)aPopoverController
{
	self.imagePickerController = nil;
    self.popoverController = nil;
}

- (void)viewDidLoad
{
    [super viewDidLoad];
    
    self.editSwitch = [[UISwitch alloc] init];
    self.navigationItem.titleView = self.editSwitch;
    
    self.navigationItem.rightBarButtonItem = BARBUTTON(@"Pick", @selector(pickImage:));

    [self.engine loadJSLibrary:@"sjcl"];
}

- (void) pickImage: (id) sender
{
	// Create an initialize the picker
	self.imagePickerController = [[UIImagePickerController alloc] init];
	self.imagePickerController.sourceType =  UIImagePickerControllerSourceTypePhotoLibrary;
    self.imagePickerController.allowsEditing = self.editSwitch.isOn;
	self.imagePickerController.delegate = self;
	
	if (IS_IPHONE) {   
        [self presentModalViewController:self.imagePickerController animated:YES];	
	} else {
        if (self.popoverController) {
            [self.popoverController dismissPopoverAnimated:NO];
        }
        self.popoverController = [[UIPopoverController alloc] initWithContentViewController:self.imagePickerController];
        self.popoverController.delegate = self;
        [self.popoverController presentPopoverFromBarButtonItem:self.navigationItem.rightBarButtonItem permittedArrowDirections:UIPopoverArrowDirectionAny animated:YES];
	}
}

- (IBAction)findPerson:(id)sender 
{
    NSString *result = [self.engine runJS:[NSString stringWithFormat:@"findPerson('%@')", 
                                           self.searchTermField.text]];
    self.resultLabel.text = result;

    NSString *image_path = [[NSBundle mainBundle] pathForResource:@"green" ofType:@"jpg"];
    NSFileHandle *image_fh = [NSFileHandle fileHandleForReadingAtPath:image_path];
    NSData *buffer = [image_fh readDataToEndOfFile];
    NSString *base64_image = [QSStrings encodeBase64WithData:buffer];
    NSLog(@"image %@.", [base64_image substringToIndex:25]);
    
    NSString *password = @"cryptogram";
    NSString *sjcl_command = [NSString 
                              stringWithFormat:@"sjcl.encrypt(\"%@\", \"%@\");",
                              password, base64_image];
    
    NSLog(@"About to encrypt.");
    NSData *encrypted_result = [[self.engine runJS:sjcl_command] 
                                dataUsingEncoding:NSUTF8StringEncoding];
    NSDictionary *encrypted_data = [NSJSONSerialization 
                                    JSONObjectWithData:encrypted_result 
                                    options:kNilOptions error:nil];

    NSString *to_hash = [NSString stringWithFormat:@"%@%@%@", 
     [encrypted_data objectForKey:@"iv"],
     [encrypted_data objectForKey:@"salt"],
     [encrypted_data objectForKey:@"ct"]];

    HashValue *data_to_hash = [HashValue sha256HashWithData:[to_hash dataUsingEncoding:NSUTF8StringEncoding]];
    NSString *integrity_check_value = [data_to_hash description];
    
    NSString *to_encrypt = [NSString stringWithFormat:@"%@%@%@%@",
                            integrity_check_value,
                            [encrypted_data objectForKey:@"iv"],
                            [encrypted_data objectForKey:@"salt"],
                            [encrypted_data objectForKey:@"ct"]];
    
    NSLog(@"Integrity check: %@.", integrity_check_value);
    NSLog(@"Result: %@", [encrypted_data objectForKey:@"iv"]);
    
}

-(IBAction)encrypt:(id)sender
{
    NSFileHandle *image = [NSFileHandle fileHandleForReadingAtPath:@"koi.jpg"];
//    NSString *sjclTest = [NSString stringWithFormat:@"sjcl.encrypt(\"%@\", \"message\");",
//                          self.passwordField.text];

}

@end
