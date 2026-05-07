//
//  ToolBarPlugin.m
//  App
//
//  Created by Simon Mechler on 2026-04-30.
//

#import <Capacitor/Capacitor.h>

CAP_PLUGIN(ToolBarPlugin, "ToolBar",
  CAP_PLUGIN_METHOD(configure, CAPPluginReturnPromise);
  CAP_PLUGIN_METHOD(show, CAPPluginReturnPromise);
  CAP_PLUGIN_METHOD(hide, CAPPluginReturnPromise);
)
