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
        return Controller.extend("punit.controller.Product", {

            onInit: function(){
                var oModel = new sap.ui.model.json.JSONModel();
                oModel.setData({
                    "postPayload": {
                        "name":   "",
                        "type":   "",
                        "sector": "",
                        "group":  "",
                        "uom":    ""
                    },
                    "editPayload": {
                        "productId": "",
                        "name":      "",
                        "type":      "",
                        "sector":    "",
                        "group":     "",
                        "uom":       ""
                    },
                    "product":               [],
                    "editMode":              false,
                    "searchProductId":       "",
                    "readSearchProductId":   "",
                    "deleteSearchProductId": "",
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
                oModel.setProperty("/readSearchProductId",   "");
                oModel.setProperty("/product",               []);
            },

            onSelectUpdate: function(){
                var oModel = this.getView().getModel();
                oModel.setProperty("/showOperationSelector", false);
                oModel.setProperty("/showCreatePanel",       false);
                oModel.setProperty("/showReadPanel",         false);
                oModel.setProperty("/showUpdatePanel",       true);
                oModel.setProperty("/showDeletePanel",       false);
                oModel.setProperty("/editMode",              false);
                oModel.setProperty("/searchProductId",       "");
            },

            onSelectDelete: function(){
                var oModel = this.getView().getModel();
                oModel.setProperty("/showOperationSelector",  false);
                oModel.setProperty("/showCreatePanel",        false);
                oModel.setProperty("/showReadPanel",          false);
                oModel.setProperty("/showUpdatePanel",        false);
                oModel.setProperty("/showDeletePanel",        true);
                oModel.setProperty("/showDeleteResult",       false);
                oModel.setProperty("/deleteSearchProductId",  "");
                oModel.setProperty("/product",                []);
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

                if(!payload.name || !payload.type || !payload.sector){
                    MessageBox.error("Please fill all required fields (Name, Type, Sector)");
                    return;
                }

                service.callService("/product", "POST", payload)
                    .then(function(){
                        MessageBox.success("Product Created Successfully");
                        oModel.setProperty("/postPayload", { "name": "", "type": "", "sector": "", "group": "", "uom": "" });
                        this.onBack();
                    }.bind(this))
                    .catch(function(err){
                        MessageBox.error("Error: Failed to create product");
                        console.error(err);
                    });
            },

            /* =========================
            READ — PRODUCT ID F4 HELP
            ========================= */

            onReadProductF4Help: function(){
                var oModel = this.getView().getModel();
                var that   = this;

                service.callService("/product", "GET", {})
                    .then(function(data){
                        var arr = Array.isArray(data) ? data : (data ? [data] : []);
                        oModel.setProperty("/product", arr);

                        if(!arr || arr.length === 0){
                            MessageBox.warning("No products available.");
                            return;
                        }

                        var oDialog = new Dialog({
                            title: "Select Product",
                            contentWidth: "500px",
                            contentHeight: "300px",
                            verticalScrolling: true,
                            content: [new List({
                                mode: "SingleSelectMaster",
                                growing: true,
                                growingThreshold: 10,
                                growingScrollToLoad: true,
                                items: {
                                    path: "/product",
                                    template: new StandardListItem({
                                        title: "{name}",
                                        description: "ID: {productId} | Type: {type} | Sector: {sector}"
                                    })
                                }
                            })],
                            beginButton: new sap.m.Button({
                                text: "Select",
                                press: function(){
                                    var oList         = oDialog.getContent()[0];
                                    var oSelectedItem = oList.getSelectedItem();
                                    if(!oSelectedItem){
                                        MessageBox.warning("Please select a product");
                                        return;
                                    }
                                    var oSelected = oSelectedItem.getBindingContext().getObject();
                                    oModel.setProperty("/readSearchProductId", String(oSelected.productId));
                                    oDialog.close();
                                    that.onReadSearchByProductId();
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
                        MessageBox.error("Failed to load products");
                    });
            },

            /* =========================
            READ — SEARCH BY PRODUCT ID
            ========================= */

            onReadSearchByProductId: function(){
                var oModel    = this.getView().getModel();
                var productId = oModel.getProperty("/readSearchProductId");
                var that      = this;

                if(!productId || String(productId).trim() === ""){
                    service.callService("/product", "GET", {})
                        .then(function(data){
                            var arr = Array.isArray(data) ? data : (data ? [data] : []);
                            oModel.setProperty("/product", arr);
                            that.getView().byId("idTable").bindRows("/product");
                            that.getView().byId("idTable").setVisibleRowCount(arr.length || 1);
                            oModel.setProperty("/showReadResult", true);
                        })
                        .catch(function(){
                            MessageBox.error("Failed to load products");
                        });
                    return;
                }

                service.callService("/product/" + productId, "GET", {})
                    .then(function(data){
                        if(!data || !data.productId){
                            MessageBox.error("Product not found");
                            oModel.setProperty("/showReadResult", false);
                            return;
                        }
                        oModel.setProperty("/product", [data]);
                        that.getView().byId("idTable").bindRows("/product");
                        that.getView().byId("idTable").setVisibleRowCount(1);
                        oModel.setProperty("/showReadResult", true);
                    })
                    .catch(function(err){
                        MessageBox.error("Product not found");
                        oModel.setProperty("/showReadResult", false);
                        console.error(err);
                    });
            },

            /* =========================
            UPDATE — PRODUCT ID F4 HELP
            ========================= */

            onUpdateProductF4Help: function(){
                var oModel = this.getView().getModel();
                var that   = this;

                service.callService("/product", "GET", {})
                    .then(function(data){
                        var arr = Array.isArray(data) ? data : (data ? [data] : []);
                        oModel.setProperty("/product", arr);

                        if(!arr || arr.length === 0){
                            MessageBox.warning("No products available.");
                            return;
                        }

                        var oDialog = new Dialog({
                            title: "Select Product",
                            contentWidth: "500px",
                            contentHeight: "300px",
                            verticalScrolling: true,
                            content: [new List({
                                mode: "SingleSelectMaster",
                                growing: true,
                                growingThreshold: 10,
                                growingScrollToLoad: true,
                                items: {
                                    path: "/product",
                                    template: new StandardListItem({
                                        title: "{name}",
                                        description: "ID: {productId} | Type: {type} | Sector: {sector}"
                                    })
                                }
                            })],
                            beginButton: new sap.m.Button({
                                text: "Select",
                                press: function(){
                                    var oList         = oDialog.getContent()[0];
                                    var oSelectedItem = oList.getSelectedItem();
                                    if(!oSelectedItem){
                                        MessageBox.warning("Please select a product");
                                        return;
                                    }
                                    var oSelected = oSelectedItem.getBindingContext().getObject();
                                    oModel.setProperty("/searchProductId", String(oSelected.productId));
                                    oDialog.close();
                                    that.onEditProduct();
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
                        MessageBox.error("Failed to load products");
                    });
            },

            /* =========================
            UPDATE — SEARCH & LOAD PRODUCT
            ========================= */

            onEditProduct: function(){
                var oModel       = this.getView().getModel();
                var oSearchInput = this.getView().byId("searchProductId");
                var productId    = oSearchInput ? oSearchInput.getValue() : oModel.getProperty("/searchProductId");

                if(!productId || String(productId).trim() === ""){
                    MessageBox.error("Please enter a Product ID");
                    return;
                }

                service.callService("/product/" + productId, "GET", {})
                    .then(function(data){
                        oModel.setProperty("/editPayload", {
                            "productId": data.productId,
                            "name":      data.name,
                            "type":      data.type,
                            "sector":    data.sector,
                            "group":     data.group,
                            "uom":       data.uom
                        });
                        oModel.setProperty("/editMode", true);
                    })
                    .catch(function(err){
                        MessageBox.error("Error: Product with ID " + productId + " not found");
                        console.error(err);
                    });
            },

            /* =========================
            UPDATE — SAVE
            ========================= */

            onUpdateProduct: function(){
                var oModel      = this.getView().getModel();
                var editPayload = oModel.getProperty("/editPayload");

                if(!editPayload.name || !editPayload.type || !editPayload.sector){
                    MessageBox.error("Please fill all required fields (Name, Type, Sector)");
                    return;
                }

                var updatePayload = {
                    "name":   editPayload.name,
                    "type":   editPayload.type,
                    "sector": editPayload.sector,
                    "group":  editPayload.group,
                    "uom":    editPayload.uom
                };

                service.callService("/product/" + editPayload.productId, "PUT", updatePayload)
                    .then(function(){
                        MessageBox.success("Product Updated Successfully");
                        this.onBack();
                    }.bind(this))
                    .catch(function(err){
                        MessageBox.error("Error: Failed to update product");
                        console.error(err);
                    });
            },

            /* =========================
            UPDATE — CANCEL EDIT
            ========================= */

            onCancelEdit: function(){
                var oModel = this.getView().getModel();
                oModel.setProperty("/editMode",        false);
                oModel.setProperty("/searchProductId", "");
                oModel.setProperty("/editPayload", {
                    "productId": "", "name": "", "type": "", "sector": "", "group": "", "uom": ""
                });
            },

            /* =========================
            DELETE — PRODUCT ID F4 HELP
            ========================= */

            onDeleteProductF4Help: function(){
                var oModel = this.getView().getModel();
                var that   = this;

                service.callService("/product", "GET", {})
                    .then(function(data){
                        var arr = Array.isArray(data) ? data : (data ? [data] : []);
                        oModel.setProperty("/product", arr);

                        if(!arr || arr.length === 0){
                            MessageBox.warning("No products available.");
                            return;
                        }

                        var oDialog = new Dialog({
                            title: "Select Product",
                            contentWidth: "500px",
                            contentHeight: "300px",
                            verticalScrolling: true,
                            content: [new List({
                                mode: "SingleSelectMaster",
                                growing: true,
                                growingThreshold: 10,
                                growingScrollToLoad: true,
                                items: {
                                    path: "/product",
                                    template: new StandardListItem({
                                        title: "{name}",
                                        description: "ID: {productId} | Type: {type} | Sector: {sector}"
                                    })
                                }
                            })],
                            beginButton: new sap.m.Button({
                                text: "Select",
                                press: function(){
                                    var oList         = oDialog.getContent()[0];
                                    var oSelectedItem = oList.getSelectedItem();
                                    if(!oSelectedItem){
                                        MessageBox.warning("Please select a product");
                                        return;
                                    }
                                    var oSelected = oSelectedItem.getBindingContext().getObject();
                                    oModel.setProperty("/deleteSearchProductId", String(oSelected.productId));
                                    oDialog.close();
                                    that.onDeleteSearchByProductId();
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
                        MessageBox.error("Failed to load products");
                    });
            },

            /* =========================
            DELETE — SEARCH BY PRODUCT ID
            ========================= */

            onDeleteSearchByProductId: function(){
                var oModel    = this.getView().getModel();
                var productId = oModel.getProperty("/deleteSearchProductId");
                var that      = this;

                if(!productId || String(productId).trim() === ""){
                    service.callService("/product", "GET", {})
                        .then(function(data){
                            var arr = Array.isArray(data) ? data : (data ? [data] : []);
                            oModel.setProperty("/product", arr);
                            that.getView().byId("idDeleteTable").bindRows("/product");
                            that.getView().byId("idDeleteTable").setVisibleRowCount(arr.length || 1);
                            oModel.setProperty("/showDeleteResult", true);
                        })
                        .catch(function(){
                            MessageBox.error("Failed to load products");
                        });
                    return;
                }

                service.callService("/product/" + productId, "GET", {})
                    .then(function(data){
                        if(!data || !data.productId){
                            MessageBox.error("Product not found");
                            oModel.setProperty("/showDeleteResult", false);
                            return;
                        }
                        oModel.setProperty("/product", [data]);
                        that.getView().byId("idDeleteTable").bindRows("/product");
                        that.getView().byId("idDeleteTable").setVisibleRowCount(1);
                        oModel.setProperty("/showDeleteResult", true);
                    })
                    .catch(function(err){
                        MessageBox.error("Product not found");
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
                                    var productId = oContext.getObject().productId;
                                    deletePromises.push(
                                        service.callService("/product/" + productId, "DELETE", {})
                                    );
                                }
                            });
                            Promise.all(deletePromises)
                                .then(function(){
                                    MessageBox.success("Product(s) deleted successfully");
                                    that.onBack();
                                })
                                .catch(function(err){
                                    MessageBox.error("Error deleting product(s)");
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
                    "name": "", "type": "", "sector": "", "group": "", "uom": ""
                });
                oModel.setProperty("/editPayload", {
                    "productId": "", "name": "", "type": "", "sector": "", "group": "", "uom": ""
                });
                oModel.setProperty("/editMode",              false);
                oModel.setProperty("/searchProductId",       "");
                oModel.setProperty("/readSearchProductId",   "");
                oModel.setProperty("/deleteSearchProductId", "");
                oModel.setProperty("/showReadResult",        false);
                oModel.setProperty("/showDeleteResult",      false);
                oModel.setProperty("/product",               []);
            }

        });
    }
);