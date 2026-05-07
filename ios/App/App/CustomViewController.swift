//
//  CustomViewController.swift
//  App
//
//  Created by Simon Mechler on 2026-04-24.
//

import Capacitor
import UIKit

class CustomViewController: CAPBridgeViewController {

    override func viewDidLoad() {
        super.viewDidLoad()

        // Do any additional setup after loading the view.
    }

    override func capacitorDidLoad() {
        bridge?.registerPluginInstance(TicketWalletPlugin())
        bridge?.registerPluginInstance(TabsBarPlugin())
        bridge?.registerPluginInstance(ToolBarPlugin())
        bridge?.registerPluginInstance(NavigationBarPlugin())
    }

    /*
    // MARK: - Navigation

    // In a storyboard-based application, you will often want to do a little preparation before navigation
    override func prepare(for segue: UIStoryboardSegue, sender: Any?) {
        // Get the new view controller using segue.destination.
        // Pass the selected object to the new view controller.
    }
    */

}
