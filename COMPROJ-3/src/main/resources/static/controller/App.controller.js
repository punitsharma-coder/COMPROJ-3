//__Developed__ by PUNIT 06-03-2026
sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/ui/core/routing/History"
], function (Controller, History) {
    "use strict";

    return Controller.extend("punit.controller.App", {

        onInit: function () {
            // Get the router
            this.oRouter = this.getOwnerComponent().getRouter();
            this.oRouter.attachRouteMatched(this.onRouteMatched, this);
        },

        onRouteMatched: function (oEvent) {
            var sRouteName = oEvent.getParameter("name");
            // You can add logic here based on route name
            console.log("Current Route: " + sRouteName);
        },

        /**
         * Navigate to Vendor Management
         */
        onVendor: function () {
            this.oRouter.navTo("RouteVendor");
        },

        /**
         * Navigate to Product Management
         */
        onProduct: function () {
            this.oRouter.navTo("RouteProduct");
        },

        /**
         * Navigate to Customer Management
         */
        onCustomer: function () {
            this.oRouter.navTo("RouteCustomer");
        },
		
		
		/**
		 * Navigate to SalesOrder Management
		 */
		onSalesOrder: function () {
		    this.oRouter.navTo("RouteSalesOrder");
		},
		
		/**
		 * Navigate to PurchaseOrder Management
		 */
		onPurchaseOrder: function (){
			this.oRouter.navTo("RoutePurchaseOrder");
		},

        /**
         * Navigate Back
         */
        onBack: function () {
            var oHistory = History.getInstance();
            var sPreviousHash = oHistory.getPreviousHash();
            if (sPreviousHash !== undefined) {
                window.history.go(-1);
            } else {
                this.oRouter.navTo("RouteHome");
            }
        }
    });
});