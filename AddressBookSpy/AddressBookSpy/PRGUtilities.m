//
//  PRGUtilities.m
//  Cryptogram
//
//  Created by Matt Tierney on 5/29/12.
//  Copyright (c) 2012 Springenwerk. All rights reserved.
//

#import "PRGUtilities.h"

@implementation PRGUtilities

+(NSString *)base64Octify:(NSString *)input {
    const NSString *encoding_table = [NSString stringWithUTF8String:_base64EncodingTable];
    NSMutableString *octal_string = [[NSMutableString alloc] init];
    for (int i = 0; i < input.length; i++) {
        // Convert to a two digit octal value that we encode.
        unichar ch = [input characterAtIndex:i];
        NSRange idx_range = [encoding_table rangeOfString:[NSString stringWithFormat:@"%c", ch]];
        NSString *octal = [NSString stringWithFormat:@"%02o", idx_range.location];
        [octal_string appendString:octal];
    }
    return octal_string;
}

@end
