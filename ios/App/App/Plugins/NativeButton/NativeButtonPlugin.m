//
//  NativeButtonPlugin.m
//  App
//
//  Created by Simon Mechler on 2026-05-19.
//

#import <Capacitor/Capacitor.h>

CAP_PLUGIN(NativeButtonPlugin, "NativeButton",
           CAP_PLUGIN_METHOD(configure, CAPPluginReturnPromise);
           CAP_PLUGIN_METHOD(show, CAPPluginReturnPromise);
           CAP_PLUGIN_METHOD(hide, CAPPluginReturnPromise);)
