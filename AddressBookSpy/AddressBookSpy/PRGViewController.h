//  PRGViewController.h
//  Cryptogram
//  Author: tierney@cs.nyu.edu (Matt Tierney)
//
//  Based on the following:
//
//  ABSViewController.h
//  AddressBookSpy
//
//  Created by Johannes Fahrenkrug on 27.02.12.
//  Copyright (c) 2012 Springenwerk. All rights reserved.
//

#import <UIKit/UIKit.h>
#import "PRGEngine.h"
#import "PRGUtilities.h"

@interface PRGViewController : UIViewController <UINavigationControllerDelegate, UIImagePickerControllerDelegate, UIPopoverControllerDelegate>

@property (strong, nonatomic) PRGEngine *engine;

@property (strong, nonatomic) UIImagePickerController *imagePickerController;
@property (strong, nonatomic) UISwitch *editSwitch;
@property (strong, nonatomic) UIPopoverController *popoverController;
@property (strong, nonatomic) IBOutlet UIImageView *imageView;

@property (weak, nonatomic) IBOutlet UITextField *searchTermField;
@property (weak, nonatomic) IBOutlet UILabel *resultLabel;

- (IBAction)findPerson:(id)sender;
- (NSString *)mimeTypeForExtension:(NSString *)ext;

@end
