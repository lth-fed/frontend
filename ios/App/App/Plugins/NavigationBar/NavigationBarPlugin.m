//
//  NavigationBarPlugin.m
//  App
//
//  Created by Simon Mechler on 2026-05-07.
//

#import <Capacitor/Capacitor.h>

CAP_PLUGIN(NavigationBarPlugin, "NavigationBar",
           CAP_PLUGIN_METHOD(configure, CAPPluginReturnPromise);
           CAP_PLUGIN_METHOD(show, CAPPluginReturnPromise);
           CAP_PLUGIN_METHOD(hide, CAPPluginReturnPromise);
           CAP_PLUGIN_METHOD(setTitle, CAPPluginReturnPromise);
           CAP_PLUGIN_METHOD(setBackButton, CAPPluginReturnPromise);
           CAP_PLUGIN_METHOD(setActionButton, CAPPluginReturnPromise);)
