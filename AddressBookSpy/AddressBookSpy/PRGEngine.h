//  PRGEngine.h
//  Cryptogram
//  Author: tierney@cs.nyu.edu (Matt Tierney)
//
//  Based on the following:
//
//  ABSEngine.h
//  AddressBookSpy
//
//  Created by Johannes Fahrenkrug on 27.02.12.
//  Copyright (c) 2012 Springenwerk. All rights reserved.
//

#import <Foundation/Foundation.h>
#import <JavaScriptCore/JavaScriptCore.h>

@interface PRGEngine : NSObject {
    JSGlobalContextRef _JSContext;
}

- (JSGlobalContextRef) JSContext;
- (NSString *)runJS:(NSString *)aJSString;
- (void)loadJSLibrary:(NSString*)libraryName;

@end
