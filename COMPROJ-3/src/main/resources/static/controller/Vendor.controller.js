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
        return Controller.extend("punit.controller.Vendor", {

            onInit: function(){
                var oModel = new sap.ui.model.json.JSONModel();
                oModel.setData({
                    "postPayload": {
                        "name":  "",
                        "city":  "",
                        "state": "",
                        "phone": ""
                    },
                    "editPayload": {
                        "vendorId": "",
                        "name":     "",
                        "city":     "",
                        "state":    "",
                        "phone":    ""
                    },
                    "vendor":                [],
                    "editMode":              false,
                    "searchVendorId":        "",
                    "readSearchVendorId":    "",
                    "deleteSearchVendorId":  "",
                    "showReadResult":        false,
                    "showDeleteResult":      false,
                    "showOperationSelector": true,
                    "showCreatePanel":       false,
                    "showReadPanel":         false,
                    "showUpdatePanel":       false,
                    "showDeletePanel":       false
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
                oModel.setProperty("/showOperationSelector", false);
                oModel.setProperty("/showCreatePanel",       false);
                oModel.setProperty("/showReadPanel",         true);
                oModel.setProperty("/showUpdatePanel",       false);
                oModel.setProperty("/showDeletePanel",       false);
                oModel.setProperty("/showReadResult",        false);
                oModel.setProperty("/readSearchVendorId",    "");
                oModel.setProperty("/vendor",                []);
            },

            onSelectUpdate: function(){
                var oModel = this.getView().getModel();
                oModel.setProperty("/showOperationSelector", false);
                oModel.setProperty("/showCreatePanel",       false);
                oModel.setProperty("/showReadPanel",         false);
                oModel.setProperty("/showUpdatePanel",       true);
                oModel.setProperty("/showDeletePanel",       false);
                oModel.setProperty("/editMode",              false);
                oModel.setProperty("/searchVendorId",        "");
            },

            onSelectDelete: function(){
                var oModel = this.getView().getModel();
                oModel.setProperty("/showOperationSelector", false);
                oModel.setProperty("/showCreatePanel",       false);
                oModel.setProperty("/showReadPanel",         false);
                oModel.setProperty("/showUpdatePanel",       false);
                oModel.setProperty("/showDeletePanel",       true);
                oModel.setProperty("/showDeleteResult",      false);
                oModel.setProperty("/deleteSearchVendorId",  "");
                oModel.setProperty("/vendor",                []);
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

                if(!payload.name || !payload.city || !payload.state || !payload.phone){
                    MessageBox.error("Please fill all required fields");
                    return;
                }

                service.callService("/vendors", "POST", payload)
                    .then(function(){
                        MessageBox.success("Vendor Created Successfully");
                        oModel.setProperty("/postPayload", { "name": "", "city": "", "state": "", "phone": "" });
                        this.onBack();
                    }.bind(this))
                    .catch(function(err){
                        MessageBox.error("Error: Failed to create vendor");
                        console.error(err);
                    });
            },

            /* =========================
            READ — VENDOR ID F4 HELP
            ========================= */

            onReadVendorF4Help: function(){
                var oModel = this.getView().getModel();
                var that   = this;

                service.callService("/vendors", "GET", {})
                    .then(function(data){
                        var arr = Array.isArray(data) ? data : (data ? [data] : []);
                        oModel.setProperty("/vendor", arr);

                        if(!arr || arr.length === 0){
                            MessageBox.warning("No vendors available.");
                            return;
                        }

                        var oDialog = new Dialog({
                            title: "Select Vendor",
                            contentWidth: "500px",
                            contentHeight: "300px",
                            verticalScrolling: true,
                            content: [new List({
                                mode: "SingleSelectMaster",
                                growing: true,
                                growingThreshold: 10,
                                growingScrollToLoad: true,
                                items: {
                                    path: "/vendor",
                                    template: new StandardListItem({
                                        title: "{name}",
                                        description: "ID: {vendorId} | City: {city} | State: {state}"
                                    })
                                }
                            })],
                            beginButton: new sap.m.Button({
                                text: "Select",
                                press: function(){
                                    var oList         = oDialog.getContent()[0];
                                    var oSelectedItem = oList.getSelectedItem();
                                    if(!oSelectedItem){
                                        MessageBox.warning("Please select a vendor");
                                        return;
                                    }
                                    var oSelected = oSelectedItem.getBindingContext().getObject();
                                    oModel.setProperty("/readSearchVendorId", String(oSelected.vendorId));
                                    oDialog.close();
                                    that.onReadSearchByVendorId();
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
                        MessageBox.error("Failed to load vendors");
                    });
            },

            /* =========================
            READ — SEARCH BY VENDOR ID
            ========================= */

            onReadSearchByVendorId: function(){
                var oModel   = this.getView().getModel();
                var vendorId = oModel.getProperty("/readSearchVendorId");
                var that     = this;

                if(!vendorId || String(vendorId).trim() === ""){
                    service.callService("/vendors", "GET", {})
                        .then(function(data){
                            var arr = Array.isArray(data) ? data : (data ? [data] : []);
                            oModel.setProperty("/vendor", arr);
                            that.getView().byId("idTable").bindRows("/vendor");
                            that.getView().byId("idTable").setVisibleRowCount(arr.length || 1);
                            oModel.setProperty("/showReadResult", true);
                        })
                        .catch(function(){
                            MessageBox.error("Failed to load vendors");
                        });
                    return;
                }

                service.callService("/vendors/" + vendorId, "GET", {})
                    .then(function(data){
                        if(!data || !data.vendorId){
                            MessageBox.error("Vendor not found");
                            oModel.setProperty("/showReadResult", false);
                            return;
                        }
                        oModel.setProperty("/vendor", [data]);
                        that.getView().byId("idTable").bindRows("/vendor");
                        that.getView().byId("idTable").setVisibleRowCount(1);
                        oModel.setProperty("/showReadResult", true);
                    })
                    .catch(function(err){
                        MessageBox.error("Vendor not found");
                        oModel.setProperty("/showReadResult", false);
                        console.error(err);
                    });
            },

            /* =========================
            UPDATE — VENDOR ID F4 HELP
            ========================= */

            onUpdateVendorF4Help: function(){
                var oModel = this.getView().getModel();
                var that   = this;

                service.callService("/vendors", "GET", {})
                    .then(function(data){
                        var arr = Array.isArray(data) ? data : (data ? [data] : []);
                        oModel.setProperty("/vendor", arr);

                        if(!arr || arr.length === 0){
                            MessageBox.warning("No vendors available.");
                            return;
                        }

                        var oDialog = new Dialog({
                            title: "Select Vendor",
                            contentWidth: "500px",
                            contentHeight: "300px",
                            verticalScrolling: true,
                            content: [new List({
                                mode: "SingleSelectMaster",
                                growing: true,
                                growingThreshold: 10,
                                growingScrollToLoad: true,
                                items: {
                                    path: "/vendor",
                                    template: new StandardListItem({
                                        title: "{name}",
                                        description: "ID: {vendorId} | City: {city} | State: {state}"
                                    })
                                }
                            })],
                            beginButton: new sap.m.Button({
                                text: "Select",
                                press: function(){
                                    var oList         = oDialog.getContent()[0];
                                    var oSelectedItem = oList.getSelectedItem();
                                    if(!oSelectedItem){
                                        MessageBox.warning("Please select a vendor");
                                        return;
                                    }
                                    var oSelected = oSelectedItem.getBindingContext().getObject();
                                    oModel.setProperty("/searchVendorId", String(oSelected.vendorId));
                                    oDialog.close();
                                    that.onEditVendor();
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
                        MessageBox.error("Failed to load vendors");
                    });
            },

            /* =========================
            UPDATE — SEARCH & LOAD VENDOR
            ========================= */

            onEditVendor: function(){
                var oModel       = this.getView().getModel();
                var oSearchInput = this.getView().byId("searchVendorId");
                var vendorId     = oSearchInput ? oSearchInput.getValue() : oModel.getProperty("/searchVendorId");

                if(!vendorId || String(vendorId).trim() === ""){
                    MessageBox.error("Please enter a Vendor ID");
                    return;
                }

                service.callService("/vendors/" + vendorId, "GET", {})
                    .then(function(data){
                        oModel.setProperty("/editPayload", {
                            "vendorId": data.vendorId,
                            "name":     data.name,
                            "city":     data.city,
                            "state":    data.state,
                            "phone":    data.phone
                        });
                        oModel.setProperty("/editMode", true);
                    })
                    .catch(function(err){
                        MessageBox.error("Error: Vendor with ID " + vendorId + " not found");
                        console.error(err);
                    });
            },

            /* =========================
            UPDATE — SAVE
            ========================= */

            onUpdateVendor: function(){
                var oModel      = this.getView().getModel();
                var editPayload = oModel.getProperty("/editPayload");

                if(!editPayload.name || !editPayload.city || !editPayload.state || !editPayload.phone){
                    MessageBox.error("Please fill all required fields");
                    return;
                }

                var updatePayload = {
                    "name":  editPayload.name,
                    "city":  editPayload.city,
                    "state": editPayload.state,
                    "phone": editPayload.phone
                };

                service.callService("/vendors/" + editPayload.vendorId, "PUT", updatePayload)
                    .then(function(){
                        MessageBox.success("Vendor Updated Successfully");
                        this.onBack();
                    }.bind(this))
                    .catch(function(err){
                        MessageBox.error("Error: Failed to update vendor");
                        console.error(err);
                    });
            },

            /* =========================
            UPDATE — CANCEL EDIT
            ========================= */

            onCancelEdit: function(){
                var oModel = this.getView().getModel();
                oModel.setProperty("/editMode",       false);
                oModel.setProperty("/searchVendorId", "");
                oModel.setProperty("/editPayload", {
                    "vendorId": "", "name": "", "city": "", "state": "", "phone": ""
                });
            },

            /* =========================
            DELETE — VENDOR ID F4 HELP
            ========================= */

            onDeleteVendorF4Help: function(){
                var oModel = this.getView().getModel();
                var that   = this;

                service.callService("/vendors", "GET", {})
                    .then(function(data){
                        var arr = Array.isArray(data) ? data : (data ? [data] : []);
                        oModel.setProperty("/vendor", arr);

                        if(!arr || arr.length === 0){
                            MessageBox.warning("No vendors available.");
                            return;
                        }

                        var oDialog = new Dialog({
                            title: "Select Vendor",
                            contentWidth: "500px",
                            contentHeight: "300px",
                            verticalScrolling: true,
                            content: [new List({
                                mode: "SingleSelectMaster",
                                growing: true,
                                growingThreshold: 10,
                                growingScrollToLoad: true,
                                items: {
                                    path: "/vendor",
                                    template: new StandardListItem({
                                        title: "{name}",
                                        description: "ID: {vendorId} | City: {city} | State: {state}"
                                    })
                                }
                            })],
                            beginButton: new sap.m.Button({
                                text: "Select",
                                press: function(){
                                    var oList         = oDialog.getContent()[0];
                                    var oSelectedItem = oList.getSelectedItem();
                                    if(!oSelectedItem){
                                        MessageBox.warning("Please select a vendor");
                                        return;
                                    }
                                    var oSelected = oSelectedItem.getBindingContext().getObject();
                                    oModel.setProperty("/deleteSearchVendorId", String(oSelected.vendorId));
                                    oDialog.close();
                                    that.onDeleteSearchByVendorId();
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
                        MessageBox.error("Failed to load vendors");
                    });
            },

            /* =========================
            DELETE — SEARCH BY VENDOR ID
            ========================= */

            onDeleteSearchByVendorId: function(){
                var oModel   = this.getView().getModel();
                var vendorId = oModel.getProperty("/deleteSearchVendorId");
                var that     = this;

                if(!vendorId || String(vendorId).trim() === ""){
                    service.callService("/vendors", "GET", {})
                        .then(function(data){
                            var arr = Array.isArray(data) ? data : (data ? [data] : []);
                            oModel.setProperty("/vendor", arr);
                            that.getView().byId("idDeleteTable").bindRows("/vendor");
                            that.getView().byId("idDeleteTable").setVisibleRowCount(arr.length || 1);
                            oModel.setProperty("/showDeleteResult", true);
                        })
                        .catch(function(){
                            MessageBox.error("Failed to load vendors");
                        });
                    return;
                }

                service.callService("/vendors/" + vendorId, "GET", {})
                    .then(function(data){
                        if(!data || !data.vendorId){
                            MessageBox.error("Vendor not found");
                            oModel.setProperty("/showDeleteResult", false);
                            return;
                        }
                        oModel.setProperty("/vendor", [data]);
                        that.getView().byId("idDeleteTable").bindRows("/vendor");
                        that.getView().byId("idDeleteTable").setVisibleRowCount(1);
                        oModel.setProperty("/showDeleteResult", true);
                    })
                    .catch(function(err){
                        MessageBox.error("Vendor not found");
                        oModel.setProperty("/showDeleteResult", false);
                        console.error(err);
                    });
            },

            /* =========================
            DELETE — DELETE SELECTED
            ========================= */

            onDeleteSelected: function(){
                var that   = this;
                var oTable = this.getView().byId("idDeleteTable");
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
                                    var vendorId = oContext.getObject().vendorId;
                                    deletePromises.push(
                                        service.callService("/vendors/" + vendorId, "DELETE", {})
                                    );
                                }
                            });
                            Promise.all(deletePromises)
                                .then(function(){
                                    MessageBox.success("Vendor(s) deleted successfully");
                                    that.onBack();
                                })
                                .catch(function(err){
                                    MessageBox.error("Error deleting vendor(s)");
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
                    "name": "", "city": "", "state": "", "phone": ""
                });
                oModel.setProperty("/editPayload", {
                    "vendorId": "", "name": "", "city": "", "state": "", "phone": ""
                });
                oModel.setProperty("/editMode",             false);
                oModel.setProperty("/searchVendorId",       "");
                oModel.setProperty("/readSearchVendorId",   "");
                oModel.setProperty("/deleteSearchVendorId", "");
                oModel.setProperty("/showReadResult",       false);
                oModel.setProperty("/showDeleteResult",     false);
                oModel.setProperty("/vendor",               []);
            }

        });
    }
);