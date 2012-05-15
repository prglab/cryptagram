//
//  PRGFlipsideViewController.h
//  cryptogram-ios
//
//  Created by Matt Tierney on 5/15/12.
//  Copyright (c) 2012 NYU. All rights reserved.
//

#import <UIKit/UIKit.h>

@class PRGFlipsideViewController;

@protocol PRGFlipsideViewControllerDelegate
- (void)flipsideViewControllerDidFinish:(PRGFlipsideViewController *)controller;
@end

@interface PRGFlipsideViewController : UIViewController

@property (weak, nonatomic) id <PRGFlipsideViewControllerDelegate> delegate;

- (IBAction)done:(id)sender;

@end
