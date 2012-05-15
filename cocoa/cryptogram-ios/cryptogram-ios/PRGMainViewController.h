//
//  PRGMainViewController.h
//  cryptogram-ios
//
//  Created by Matt Tierney on 5/15/12.
//  Copyright (c) 2012 NYU. All rights reserved.
//

#import "PRGFlipsideViewController.h"

@interface PRGMainViewController : UIViewController <PRGFlipsideViewControllerDelegate, UIPopoverControllerDelegate>

@property (strong, nonatomic) NSManagedObjectContext *managedObjectContext;

@property (strong, nonatomic) UIPopoverController *flipsidePopoverController;

@end
