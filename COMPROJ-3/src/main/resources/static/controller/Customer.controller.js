//__Developed__ by PUNIT 06-03-2026
sap.ui.define(
    [
        "sap/ui/core/mvc/Controller",
        "jquery.sap.global",
        "punit/util/service",
        "sap/m/MessageBox",
        "sap/m/Dialog",
        "sap/m/List",
        "sap/m/StandardListItem"
    ],
    function(Controller, jQuery, service, MessageBox, Dialog, List, StandardListItem){
        return Controller.extend("punit.controller.Customer", {

            onInit: function(){
                var oModel = new sap.ui.model.json.JSONModel();
                oModel.setData({
                    "postPayload": {
                        "name":    "",
                        "city":    "",
                        "state":   "",
                        "phone":   "",
                        "address": ""
                    },
                    "editPayload": {
                        "customerId": "",
                        "name":       "",
                        "city":       "",
                        "state":      "",
                        "phone":      "",
                        "address":    ""
                    },
                    "customer":               [],
                    "editMode":               false,
                    "searchCustomerId":       "",
                    "readSearchCustomerId":   "",
                    "deleteSearchCustomerId": "",
                    "showReadResult":         false,
                    "showDeleteResult":       false,
                    "showOperationSelector":  true,
                    "showCreatePanel":        false,
                    "showReadPanel":          false,
                    "showUpdatePanel":        false,
                    "showDeletePanel":        false
                });
                this.getView().setModel(oModel);
            },

            /* =========================
            OPERATION SELECTION
            ========================= */

            onSelectCreate: function(){
                var oModel = this.getView().getModel();
                oModel.setProperty("/showOperationSelector", false);
                oModel.setProperty("/showCreatePanel",       true);
                oModel.setProperty("/showReadPanel",         false);
                oModel.setProperty("/showUpdatePanel",       false);
                oModel.setProperty("/showDeletePanel",       false);
            },

            onSelectRead: function(){
                var oModel = this.getView().getModel();
                oModel.setProperty("/showOperationSelector",  false);
                oModel.setProperty("/showCreatePanel",        false);
                oModel.setProperty("/showReadPanel",          true);
                oModel.setProperty("/showUpdatePanel",        false);
                oModel.setProperty("/showDeletePanel",        false);
                oModel.setProperty("/showReadResult",         false);
                oModel.setProperty("/readSearchCustomerId",   "");
                oModel.setProperty("/customer",               []);
            },

            onSelectUpdate: function(){
                var oModel = this.getView().getModel();
                oModel.setProperty("/showOperationSelector", false);
                oModel.setProperty("/showCreatePanel",       false);
                oModel.setProperty("/showReadPanel",         false);
                oModel.setProperty("/showUpdatePanel",       true);
                oModel.setProperty("/showDeletePanel",       false);
                oModel.setProperty("/editMode",              false);
                oModel.setProperty("/searchCustomerId",      "");
            },

            onSelectDelete: function(){
                var oModel = this.getView().getModel();
                oModel.setProperty("/showOperationSelector",   false);
                oModel.setProperty("/showCreatePanel",         false);
                oModel.setProperty("/showReadPanel",           false);
                oModel.setProperty("/showUpdatePanel",         false);
                oModel.setProperty("/showDeletePanel",         true);
                oModel.setProperty("/showDeleteResult",        false);
                oModel.setProperty("/deleteSearchCustomerId",  "");
                oModel.setProperty("/customer",                []);
            },

            /* =========================
            BACK
            ========================= */

            onBack: function(){
                var oModel = this.getView().getModel();
                oModel.setProperty("/showOperationSelector", true);
                oModel.setProperty("/showCreatePanel",       false);
                oModel.setProperty("/showReadPanel",         false);
                oModel.setProperty("/showUpdatePanel",       false);
                oModel.setProperty("/showDeletePanel",       false);
                this.resetAllData();
            },

            onBackOpScreen: function(){
                this.getOwnerComponent().getRouter().navTo("RouteHome");
            },

            /* =========================
            CREATE — SAVE
            ========================= */

            onSave: function(){
                var oModel  = this.getView().getModel();
                var payload = oModel.getProperty("/postPayload");

                if(!payload.name || !payload.city || !payload.state){
                    MessageBox.error("Please fill all required fields (Name, City, State)");
                    return;
                }

                service.callService("/customer", "POST", payload)
                    .then(function(){
                        MessageBox.success("Customer Created Successfully");
                        oModel.setProperty("/postPayload", { "name": "", "city": "", "state": "", "phone": "", "address": "" });
                        this.onBack();
                    }.bind(this))
                    .catch(function(err){
                        MessageBox.error("Error: Failed to create customer");
                        console.error(err);
                    });
            },

            /* =========================
            READ — CUSTOMER ID F4 HELP
            ========================= */

            onReadCustomerF4Help: function(){
                var oModel = this.getView().getModel();
                var that   = this;

                service.callService("/customer", "GET", {})
                    .then(function(data){
                        var arr = Array.isArray(data) ? data : (data ? [data] : []);
                        oModel.setProperty("/customer", arr);

                        if(!arr || arr.length === 0){
                            MessageBox.warning("No customers available.");
                            return;
                        }

                        var oDialog = new Dialog({
                            title: "Select Customer",
                            contentWidth: "500px",
                            contentHeight: "300px",
                            verticalScrolling: true,
                            content: [new List({
                                mode: "SingleSelectMaster",
                                growing: true,
                                growingThreshold: 10,
                                growingScrollToLoad: true,
                                items: {
                                    path: "/customer",
                                    template: new StandardListItem({
                                        title: "{name}",
                                        description: "ID: {customerId} | City: {city} | State: {state}"
                                    })
                                }
                            })],
                            beginButton: new sap.m.Button({
                                text: "Select",
                                press: function(){
                                    var oList         = oDialog.getContent()[0];
                                    var oSelectedItem = oList.getSelectedItem();
                                    if(!oSelectedItem){
                                        MessageBox.warning("Please select a customer");
                                        return;
                                    }
                                    var oSelected = oSelectedItem.getBindingContext().getObject();
                                    oModel.setProperty("/readSearchCustomerId", String(oSelected.customerId));
                                    oDialog.close();
                                    that.onReadSearchByCustomerId();
                                }
                            }),
                            endButton: new sap.m.Button({
                                text: "Cancel",
                                press: function(){ oDialog.close(); }
                            })
                        });
                        oDialog.setModel(oModel);
                        oDialog.open();
                    })
                    .catch(function(){
                        MessageBox.error("Failed to load customers");
                    });
            },

            /* =========================
            READ — SEARCH BY CUSTOMER ID
            ========================= */

            onReadSearchByCustomerId: function(){
                var oModel     = this.getView().getModel();
                var customerId = oModel.getProperty("/readSearchCustomerId");
                var that       = this;

                if(!customerId || String(customerId).trim() === ""){
                    service.callService("/customer", "GET", {})
                        .then(function(data){
                            var arr = Array.isArray(data) ? data : (data ? [data] : []);
                            oModel.setProperty("/customer", arr);
                            that.getView().byId("idCustomerTable").bindRows("/customer");
                            that.getView().byId("idCustomerTable").setVisibleRowCount(arr.length || 1);
                            oModel.setProperty("/showReadResult", true);
                        })
                        .catch(function(){
                            MessageBox.error("Failed to load customers");
                        });
                    return;
                }

                service.callService("/customer/" + customerId, "GET", {})
                    .then(function(data){
                        if(!data || !data.customerId){
                            MessageBox.error("Customer not found");
                            oModel.setProperty("/showReadResult", false);
                            return;
                        }
                        oModel.setProperty("/customer", [data]);
                        that.getView().byId("idCustomerTable").bindRows("/customer");
                        that.getView().byId("idCustomerTable").setVisibleRowCount(1);
                        oModel.setProperty("/showReadResult", true);
                    })
                    .catch(function(err){
                        MessageBox.error("Customer not found");
                        oModel.setProperty("/showReadResult", false);
                        console.error(err);
                    });
            },

            /* =========================
            UPDATE — CUSTOMER ID F4 HELP
            ========================= */

            onUpdateCustomerF4Help: function(){
                var oModel = this.getView().getModel();
                var that   = this;

                service.callService("/customer", "GET", {})
                    .then(function(data){
                        var arr = Array.isArray(data) ? data : (data ? [data] : []);
                        oModel.setProperty("/customer", arr);

                        if(!arr || arr.length === 0){
                            MessageBox.warning("No customers available.");
                            return;
                        }

                        var oDialog = new Dialog({
                            title: "Select Customer",
                            contentWidth: "500px",
                            contentHeight: "300px",
                            verticalScrolling: true,
                            content: [new List({
                                mode: "SingleSelectMaster",
                                growing: true,
                                growingThreshold: 10,
                                growingScrollToLoad: true,
                                items: {
                                    path: "/customer",
                                    template: new StandardListItem({
                                        title: "{name}",
                                        description: "ID: {customerId} | City: {city} | State: {state}"
                                    })
                                }
                            })],
                            beginButton: new sap.m.Button({
                                text: "Select",
                                press: function(){
                                    var oList         = oDialog.getContent()[0];
                                    var oSelectedItem = oList.getSelectedItem();
                                    if(!oSelectedItem){
                                        MessageBox.warning("Please select a customer");
                                        return;
                                    }
                                    var oSelected = oSelectedItem.getBindingContext().getObject();
                                    oModel.setProperty("/searchCustomerId", String(oSelected.customerId));
                                    oDialog.close();
                                    that.onEditCustomer();
                                }
                            }),
                            endButton: new sap.m.Button({
                                text: "Cancel",
                                press: function(){ oDialog.close(); }
                            })
                        });
                        oDialog.setModel(oModel);
                        oDialog.open();
                    })
                    .catch(function(){
                        MessageBox.error("Failed to load customers");
                    });
            },

            /* =========================
            UPDATE — SEARCH & LOAD CUSTOMER
            ========================= */

            onEditCustomer: function(){
                var oModel       = this.getView().getModel();
                var oSearchInput = this.getView().byId("searchCustomerId");
                var customerId   = oSearchInput ? oSearchInput.getValue() : oModel.getProperty("/searchCustomerId");

                if(!customerId || String(customerId).trim() === ""){
                    MessageBox.error("Please enter a Customer ID");
                    return;
                }

                service.callService("/customer/" + customerId, "GET", {})
                    .then(function(data){
                        oModel.setProperty("/editPayload", {
                            "customerId": data.customerId,
                            "name":       data.name,
                            "city":       data.city,
                            "state":      data.state,
                            "phone":      data.phone,
                            "address":    data.address
                        });
                        oModel.setProperty("/editMode", true);
                    })
                    .catch(function(err){
                        MessageBox.error("Error: Customer with ID " + customerId + " not found");
                        console.error(err);
                    });
            },

            /* =========================
            UPDATE — SAVE
            ========================= */

            onUpdateCustomer: function(){
                var oModel      = this.getView().getModel();
                var editPayload = oModel.getProperty("/editPayload");

                if(!editPayload.name || !editPayload.city || !editPayload.state){
                    MessageBox.error("Please fill all required fields (Name, City, State)");
                    return;
                }

                var updatePayload = {
                    "name":    editPayload.name,
                    "city":    editPayload.city,
                    "state":   editPayload.state,
                    "phone":   editPayload.phone,
                    "address": editPayload.address
                };

                service.callService("/customer/" + editPayload.customerId, "PUT", updatePayload)
                    .then(function(){
                        MessageBox.success("Customer Updated Successfully");
                        this.onBack();
                    }.bind(this))
                    .catch(function(err){
                        MessageBox.error("Error: Failed to update customer");
                        console.error(err);
                    });
            },

            /* =========================
            UPDATE — CANCEL EDIT
            ========================= */

            onCancelEdit: function(){
                var oModel = this.getView().getModel();
                oModel.setProperty("/editMode",         false);
                oModel.setProperty("/searchCustomerId", "");
                oModel.setProperty("/editPayload", {
                    "customerId": "", "name": "", "city": "", "state": "", "phone": "", "address": ""
                });
            },

            /* =========================
            DELETE — CUSTOMER ID F4 HELP
            ========================= */

            onDeleteCustomerF4Help: function(){
                var oModel = this.getView().getModel();
                var that   = this;

                service.callService("/customer", "GET", {})
                    .then(function(data){
                        var arr = Array.isArray(data) ? data : (data ? [data] : []);
                        oModel.setProperty("/customer", arr);

                        if(!arr || arr.length === 0){
                            MessageBox.warning("No customers available.");
                            return;
                        }

                        var oDialog = new Dialog({
                            title: "Select Customer",
                            contentWidth: "500px",
                            contentHeight: "300px",
                            verticalScrolling: true,
                            content: [new List({
                                mode: "SingleSelectMaster",
                                growing: true,
                                growingThreshold: 10,
                                growingScrollToLoad: true,
                                items: {
                                    path: "/customer",
                                    template: new StandardListItem({
                                        title: "{name}",
                                        description: "ID: {customerId} | City: {city} | State: {state}"
                                    })
                                }
                            })],
                            beginButton: new sap.m.Button({
                                text: "Select",
                                press: function(){
                                    var oList         = oDialog.getContent()[0];
                                    var oSelectedItem = oList.getSelectedItem();
                                    if(!oSelectedItem){
                                        MessageBox.warning("Please select a customer");
                                        return;
                                    }
                                    var oSelected = oSelectedItem.getBindingContext().getObject();
                                    oModel.setProperty("/deleteSearchCustomerId", String(oSelected.customerId));
                                    oDialog.close();
                                    that.onDeleteSearchByCustomerId();
                                }
                            }),
                            endButton: new sap.m.Button({
                                text: "Cancel",
                                press: function(){ oDialog.close(); }
                            })
                        });
                        oDialog.setModel(oModel);
                        oDialog.open();
                    })
                    .catch(function(){
                        MessageBox.error("Failed to load customers");
                    });
            },

            /* =========================
            DELETE — SEARCH BY CUSTOMER ID
            ========================= */

            onDeleteSearchByCustomerId: function(){
                var oModel     = this.getView().getModel();
                var customerId = oModel.getProperty("/deleteSearchCustomerId");
                var that       = this;

                if(!customerId || String(customerId).trim() === ""){
                    service.callService("/customer", "GET", {})
                        .then(function(data){
                            var arr = Array.isArray(data) ? data : (data ? [data] : []);
                            oModel.setProperty("/customer", arr);
                            that.getView().byId("idDeleteCustomerTable").bindRows("/customer");
                            that.getView().byId("idDeleteCustomerTable").setVisibleRowCount(arr.length || 1);
                            oModel.setProperty("/showDeleteResult", true);
                        })
                        .catch(function(){
                            MessageBox.error("Failed to load customers");
                        });
                    return;
                }

                service.callService("/customer/" + customerId, "GET", {})
                    .then(function(data){
                        if(!data || !data.customerId){
                            MessageBox.error("Customer not found");
                            oModel.setProperty("/showDeleteResult", false);
                            return;
                        }
                        oModel.setProperty("/customer", [data]);
                        that.getView().byId("idDeleteCustomerTable").bindRows("/customer");
                        that.getView().byId("idDeleteCustomerTable").setVisibleRowCount(1);
                        oModel.setProperty("/showDeleteResult", true);
                    })
                    .catch(function(err){
                        MessageBox.error("Customer not found");
                        oModel.setProperty("/showDeleteResult", false);
                        console.error(err);
                    });
            },

            /* =========================
            DELETE — DELETE SELECTED
            ========================= */

            onDeleteSelected: function(){
                var that   = this;
                var oTable = this.getView().byId("idDeleteCustomerTable");
                var aSelectedIndices = oTable.getSelectedIndices();

                if(aSelectedIndices.length === 0){
                    MessageBox.warning("Please select at least one row to delete");
                    return;
                }

                MessageBox.confirm("Are you sure you want to delete " + aSelectedIndices.length + " selected record(s)?", {
                    onClose: function(oAction){
                        if(oAction === "OK"){
                            var deletePromises = [];
                            aSelectedIndices.forEach(function(iIndex){
                                var oContext = oTable.getContextByIndex(iIndex);
                                if(oContext){
                                    var customerId = oContext.getObject().customerId;
                                    deletePromises.push(
                                        service.callService("/customer/" + customerId, "DELETE", {})
                                    );
                                }
                            });
                            Promise.all(deletePromises)
                                .then(function(){
                                    MessageBox.success("Customer(s) deleted successfully");
                                    that.onBack();
                                })
                                .catch(function(err){
                                    MessageBox.error("Error deleting customer(s)");
                                    console.error(err);
                                });
                        }
                    }
                });
            },

            /* =========================
            RESET ALL DATA
            ========================= */

            resetAllData: function(){
                var oModel = this.getView().getModel();
                oModel.setProperty("/postPayload", {
                    "name": "", "city": "", "state": "", "phone": "", "address": ""
                });
                oModel.setProperty("/editPayload", {
                    "customerId": "", "name": "", "city": "", "state": "", "phone": "", "address": ""
                });
                oModel.setProperty("/editMode",               false);
                oModel.setProperty("/searchCustomerId",       "");
                oModel.setProperty("/readSearchCustomerId",   "");
                oModel.setProperty("/deleteSearchCustomerId", "");
                oModel.setProperty("/showReadResult",         false);
                oModel.setProperty("/showDeleteResult",       false);
                oModel.setProperty("/customer",               []);
            }

        });
    }
);