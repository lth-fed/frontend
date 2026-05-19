// NOTE:
// This file was copied/adapted from the Stay Liquid project by Alistair Heath:
// https://github.com/alistairheath/stay-liquid
//
// Original repository copyright and license terms apply.
// Please refer to the original project for full attribution and licensing
// details.

#import <Capacitor/Capacitor.h>

CAP_PLUGIN(TabsBarPlugin, "TabsBar",
           CAP_PLUGIN_METHOD(configure, CAPPluginReturnPromise);
           CAP_PLUGIN_METHOD(show, CAPPluginReturnPromise);
           CAP_PLUGIN_METHOD(hide, CAPPluginReturnPromise);
           CAP_PLUGIN_METHOD(select, CAPPluginReturnPromise);
           CAP_PLUGIN_METHOD(setBadge, CAPPluginReturnPromise);
           CAP_PLUGIN_METHOD(getSafeAreaInsets, CAPPluginReturnPromise);)
