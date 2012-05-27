//
//  ABSViewController.m
//  AddressBookSpy
//
//  Created by Johannes Fahrenkrug on 27.02.12.
//  Copyright (c) 2012 Springenwerk. All rights reserved.
//

#import "ABSViewController.h"
#import "QSUtilities.h"
#import "HashValue.h"
#import <Foundation/NSJSONSerialization.h>
#include <CommonCrypto/CommonDigest.h>

@implementation ABSViewController
@synthesize engine=_engine, searchTermField=_searchTermField, resultLabel=_resultLabel;

- (id)initWithNibName:(NSString *)nibNameOrNil bundle:(NSBundle *)nibBundleOrNil 
{
    self = [super initWithNibName:nibNameOrNil bundle:nibBundleOrNil];
    if (self) {
        self.engine = [[ABSEngine alloc] init];
    }
    return self;
}

- (void)viewDidLoad
{
    [super viewDidLoad];
    
    [self.engine loadJSLibrary:@"sjcl"];
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
