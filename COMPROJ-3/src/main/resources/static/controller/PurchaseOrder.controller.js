sap.ui.define(
    [
        "sap/ui/core/mvc/Controller",
        "jquery.sap.global",
        "punit/util/service",
        "sap/m/MessageBox",
        "sap/m/Dialog",
        "sap/m/List",
        "sap/m/StandardListItem",
        "sap/ui/model/json/JSONModel"
    ],
    function(Controller, jQuery, service, MessageBox, Dialog, List, StandardListItem, JSONModel){

        return Controller.extend("punit.controller.PurchaseOrder", {

            onInit: function(){
                var oModel = new JSONModel();
                oModel.setData({
                    "createPayload": {
                        "poId":         null,
                        "orderDate":    null,
                        "deliveryDate": null,
                        "vendor": { "vendorId": null, "name": "" },
                        "items": [
                            { "material": "", "quantity": null, "uom": "" },
                            { "material": "", "quantity": null, "uom": "" },
                            { "material": "", "quantity": null, "uom": "" }
                        ]
                    },
                    "editItemPayload": {
                        "poItemId":      null,
                        "material":      "",
                        "quantity":      null,
                        "uom":           "",
                        "purchaseOrder": { "poId": null }
                    },
                    "purchaseOrders":      [],
                    "purchaseOrderItems":  [],
                    "vendorList":          [],
                    "productList":         [],
                    "searchItemId":        "",
                    "searchPoNumber":      "",
                    "readSearchPoNumber":  "",
                    "filteredPoHeader":    null,
                    "filteredPoItems":     [],
                    "showReadResult":      false,
                    "showItemsTable":      false,
                    "showPoSearchResult":  false,
                    "editItemMode":        false,
                    "showOperationSelector": true,
                    "showCreatePanel":       false,
                    "showReadPanel":         false,
                    "showUpdatePanel":       false
                });
                this.getView().setModel(oModel);
                this.loadVendorsForF4();
                this.loadProductsForF4();
            },

            /* =========================
            LOAD VENDORS
            ========================= */

            loadVendorsForF4: function(){
                var that = this;
                service.callService("/vendors", "GET", {})
                    .then(function(data){
                        var oModel = that.getView().getModel();
                        var arr = Array.isArray(data) ? data : (data ? [data] : []);
                        oModel.setProperty("/vendorList", arr);
                    })
                    .catch(function(){
                        MessageBox.error("Failed to load vendors");
                    });
            },

            /* =========================
            LOAD PRODUCTS
            ========================= */

            loadProductsForF4: function(){
                var that = this;
                service.callService("/product", "GET", {})
                    .then(function(data){
                        var oModel = that.getView().getModel();
                        var arr = Array.isArray(data) ? data : (data ? [data] : []);
                        oModel.setProperty("/productList", arr);
                    })
                    .catch(function(){
                        MessageBox.error("Failed to load products");
                    });
            },

            /* =========================
            VENDOR F4 HELP (CREATE)
            ========================= */

            onVendorF4Help: function(){
                var oModel     = this.getView().getModel();
                var vendorList = oModel.getProperty("/vendorList") || [];

                if(!vendorList || vendorList.length === 0){
                    MessageBox.warning("No vendors available. Please create vendors first.");
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
                        growingThreshold: 5,
                        growingScrollToLoad: true,
                        items: {
                            path: "/vendorList",
                            template: new StandardListItem({
                                title: "{name}",
                                description: "ID: {vendorId}"
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
                            oModel.setProperty("/createPayload/vendor", {
                                "vendorId": oSelected.vendorId,
                                "name":     oSelected.name
                            });
                            oDialog.close();
                        }
                    }),
                    endButton: new sap.m.Button({
                        text: "Cancel",
                        press: function(){ oDialog.close(); }
                    })
                });
                oDialog.setModel(oModel);
                oDialog.open();
            },

            /* =========================
            VENDOR F4 HELP (UPDATE)
            ========================= */

            onUpdateVendorF4Help: function(){
                var oModel     = this.getView().getModel();
                var vendorList = oModel.getProperty("/vendorList") || [];

                if(!vendorList || vendorList.length === 0){
                    MessageBox.warning("No vendors available. Please create vendors first.");
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
                        growingThreshold: 5,
                        growingScrollToLoad: true,
                        items: {
                            path: "/vendorList",
                            template: new StandardListItem({
                                title: "{name}",
                                description: "ID: {vendorId}"
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
                            var oSelected     = oSelectedItem.getBindingContext().getObject();
                            var headerArray   = oModel.getProperty("/filteredPoHeader");
                            headerArray[0].vendor = {
                                vendorId: oSelected.vendorId,
                                name:     oSelected.name
                            };
                            oModel.setProperty("/filteredPoHeader", headerArray);
                            oModel.refresh(true);
                            oDialog.close();
                        }
                    }),
                    endButton: new sap.m.Button({
                        text: "Cancel",
                        press: function(){ oDialog.close(); }
                    })
                });
                oDialog.setModel(oModel);
                oDialog.open();
            },

            /* =========================
            MATERIAL F4 HELP (CREATE)
            ========================= */

            onMaterialF4Help: function(oEvent){
                var oModel      = this.getView().getModel();
                var productList = oModel.getProperty("/productList") || [];

                if(!productList || productList.length === 0){
                    MessageBox.warning("No products available. Please create products first.");
                    return;
                }

                var oButton   = oEvent.getSource();
                var oContext  = oButton.getBindingContext();
                var sPath     = oContext ? oContext.getPath() : null;
                var iRowIndex = sPath ? parseInt(sPath.split("/").pop()) : null;

                var oDialog = new Dialog({
                    title: "Select Material",
                    contentWidth: "500px",
                    contentHeight: "300px",
                    verticalScrolling: true,
                    content: [new List({
                        mode: "SingleSelectMaster",
                        growing: true,
                        growingThreshold: 5,
                        growingScrollToLoad: true,
                        items: {
                            path: "/productList",
                            template: new StandardListItem({
                                title: "{name}",
                                description: "Type: {type} | Sector: {sector} | UOM: {uom}"
                            })
                        }
                    })],
                    beginButton: new sap.m.Button({
                        text: "Select",
                        press: function(){
                            var oList            = oDialog.getContent()[0];
                            var oSelectedItem    = oList.getSelectedItem();
                            if(!oSelectedItem){
                                MessageBox.warning("Please select a material");
                                return;
                            }
                            var oSelectedProduct = oSelectedItem.getBindingContext().getObject();
                            var aItems           = oModel.getProperty("/createPayload/items");
                            var bAlreadyExists   = aItems.some(function(oItem, iIndex){
                                return iIndex !== iRowIndex && oItem.material === oSelectedProduct.name;
                            });
                            if(bAlreadyExists){
                                MessageBox.warning(
                                    "Material '" + oSelectedProduct.name + "' is already added. Please select a different material."
                                );
                                return;
                            }
                            if(iRowIndex !== null && aItems[iRowIndex] !== undefined){
                                aItems[iRowIndex].material = oSelectedProduct.name;
                                aItems[iRowIndex].uom      = oSelectedProduct.uom;
                                oModel.setProperty("/createPayload/items", aItems);
                            }
                            oDialog.close();
                        }
                    }),
                    endButton: new sap.m.Button({
                        text: "Cancel",
                        press: function(){ oDialog.close(); }
                    })
                });
                oDialog.setModel(oModel);
                oDialog.open();
            },

            /* =========================
            PO NUMBER F4 HELP (READ)
            ========================= */

            onReadPoNumberF4Help: function(){
                var oModel = this.getView().getModel();
                var that   = this;

                service.callService("/purchaseorderheader", "GET", {})
                    .then(function(data){
                        var arr = Array.isArray(data) ? data : (data ? [data] : []);
                        oModel.setProperty("/purchaseOrders", arr);

                        if(!arr || arr.length === 0){
                            MessageBox.warning("No Purchase Orders available.");
                            return;
                        }

                        var oDialog = new Dialog({
                            title: "Select PO Number",
                            contentWidth: "500px",
                            contentHeight: "300px",
                            verticalScrolling: true,
                            content: [new List({
                                mode: "SingleSelectMaster",
                                growing: true,
                                growingThreshold: 10,
                                growingScrollToLoad: true,
                                items: {
                                    path: "/purchaseOrders",
                                    template: new StandardListItem({
                                        title: "PO Number: {poId}",
                                        description: "Order Date: {orderDate} | Vendor: {vendor/name}"
                                    })
                                }
                            })],
                            beginButton: new sap.m.Button({
                                text: "Select",
                                press: function(){
                                    var oList         = oDialog.getContent()[0];
                                    var oSelectedItem = oList.getSelectedItem();
                                    if(!oSelectedItem){
                                        MessageBox.warning("Please select a PO Number");
                                        return;
                                    }
                                    var oSelected = oSelectedItem.getBindingContext().getObject();
                                    oModel.setProperty("/readSearchPoNumber", String(oSelected.poId));
                                    oDialog.close();
                                    that.onReadSearchByPoNumber();
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
                        MessageBox.error("Failed to load Purchase Orders");
                    });
            },

            /* =========================
            PO NUMBER F4 HELP (UPDATE)
            ========================= */

            onUpdatePoNumberF4Help: function(){
                var oModel = this.getView().getModel();
                var that   = this;

                service.callService("/purchaseorderheader", "GET", {})
                    .then(function(data){
                        var arr = Array.isArray(data) ? data : (data ? [data] : []);
                        oModel.setProperty("/purchaseOrders", arr);

                        if(!arr || arr.length === 0){
                            MessageBox.warning("No Purchase Orders available.");
                            return;
                        }

                        var oDialog = new Dialog({
                            title: "Select PO Number",
                            contentWidth: "500px",
                            contentHeight: "300px",
                            verticalScrolling: true,
                            content: [new List({
                                mode: "SingleSelectMaster",
                                growing: true,
                                growingThreshold: 10,
                                growingScrollToLoad: true,
                                items: {
                                    path: "/purchaseOrders",
                                    template: new StandardListItem({
                                        title: "PO Number: {poId}",
                                        description: "Order Date: {orderDate} | Vendor: {vendor/name}"
                                    })
                                }
                            })],
                            beginButton: new sap.m.Button({
                                text: "Select",
                                press: function(){
                                    var oList         = oDialog.getContent()[0];
                                    var oSelectedItem = oList.getSelectedItem();
                                    if(!oSelectedItem){
                                        MessageBox.warning("Please select a PO Number");
                                        return;
                                    }
                                    var oSelected = oSelectedItem.getBindingContext().getObject();
                                    oModel.setProperty("/searchPoNumber", String(oSelected.poId));
                                    oDialog.close();
                                    that.onSearchByPoNumber();
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
                        MessageBox.error("Failed to load Purchase Orders");
                    });
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
            },

            onSelectRead: function(){
                var oModel = this.getView().getModel();
                oModel.setProperty("/showOperationSelector", false);
                oModel.setProperty("/showCreatePanel",       false);
                oModel.setProperty("/showReadPanel",         true);
                oModel.setProperty("/showUpdatePanel",       false);
                oModel.setProperty("/showReadResult",        false);
                oModel.setProperty("/showItemsTable",        false);
                oModel.setProperty("/readSearchPoNumber",    "");
                oModel.setProperty("/purchaseOrders",        []);
                oModel.setProperty("/purchaseOrderItems",    []);
            },

            onSelectUpdate: function(){
                var oModel = this.getView().getModel();
                oModel.setProperty("/showOperationSelector", false);
                oModel.setProperty("/showCreatePanel",       false);
                oModel.setProperty("/showReadPanel",         false);
                oModel.setProperty("/showUpdatePanel",       true);
                oModel.setProperty("/editItemMode",          false);
                oModel.setProperty("/searchPoNumber",        "");
                oModel.setProperty("/showPoSearchResult",    false);
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
                this.resetAllData();
            },

            onBackOpScreen: function(){
                this.getOwnerComponent().getRouter().navTo("RouteHome");
            },

            /* =========================
            CREATE — SAVE
            ========================= */

            onSaveCombined: function(){
                var oModel  = this.getView().getModel();
                var payload = oModel.getProperty("/createPayload");
                var that    = this;

                if(!payload.orderDate || !payload.vendor || !payload.vendor.vendorId){
                    MessageBox.error("Order Date and Vendor are required.");
                    return;
                }

                // Filter out empty rows
                var items = (payload.items || []).filter(function(item){
                    return item.material && String(item.material).trim() !== "" && item.quantity;
                });

                if(items.length === 0){
                    MessageBox.error("Please fill in at least one item row completely.");
                    return;
                }

                var poIdEntered = payload.poId ? String(payload.poId).trim() : "";
                if(poIdEntered !== ""){
                    service.callService("/purchaseorderheader/" + poIdEntered, "GET", {})
                        .then(function(existingHeader){
                            if(!existingHeader || !existingHeader.poId){
                                MessageBox.error("That PO Number doesn't exist. Please leave it blank to auto-generate.");
                                return;
                            }
                            that._createAllPoItems(parseInt(existingHeader.poId), items);
                        })
                        .catch(function(err){
                            MessageBox.error("That PO Number doesn't exist. Please leave it blank to auto-generate.");
                            console.error(err);
                        });
                } else {
                    that._createHeaderThenAllItems(payload, items);
                }
            },

            _createHeaderThenAllItems: function(payload, items){
                var that          = this;
                var headerPayload = {
                    "orderDate":    payload.orderDate,
                    "deliveryDate": payload.deliveryDate,
                    "vendor":       { "vendorId": payload.vendor.vendorId }
                };
                service.callService("/purchaseorderheader", "POST", headerPayload)
                    .then(function(headerResponse){
                        return that._createAllPoItems(headerResponse.poId, items);
                    })
                    .catch(function(err){
                        MessageBox.error("Error creating Purchase Order Header.");
                        console.error(err);
                    });
            },

            _createAllPoItems: function(poId, items){
                var that         = this;
                var createdItems = [];

                var chain = items.reduce(function(promiseChain, item){
                    return promiseChain.then(function(){
                        var itemPayload = {
                            "material":      item.material,
                            "quantity":      item.quantity ? parseInt(item.quantity) : null,
                            "uom":           item.uom,
                            "purchaseOrder": { "poId": parseInt(poId) }
                        };
                        return service.callService("/purchaseorderitem", "POST", itemPayload)
                            .then(function(itemResponse){
                                createdItems.push(itemResponse);
                            });
                    });
                }, Promise.resolve());

                return chain
                    .then(function(){
                        var itemIds = createdItems.map(function(i){ return i.poItemId; }).join(", ");
                        MessageBox.success(
                            "Purchase Order created successfully!\n" +
                            "PO ID: " + poId + "\n" +
                            "Items Created: " + createdItems.length + "\n" +
                            "Item IDs: " + itemIds
                        );
                        that.onBack();
                    })
                    .catch(function(err){
                        MessageBox.error("Error creating one or more PO Items.");
                        console.error(err);
                    });
            },

            /* =========================
            READ — SEARCH BY PO NUMBER
            ========================= */

            onReadSearchByPoNumber: function(){
                var oModel   = this.getView().getModel();
                var poNumber = oModel.getProperty("/readSearchPoNumber");
                var that     = this;

                // Empty → load all PO headers only (no items)
                if(!poNumber || String(poNumber).trim() === ""){
                    service.callService("/purchaseorderheader", "GET", {})
                        .then(function(data){
                            var arr = Array.isArray(data) ? data : (data ? [data] : []);
                            oModel.setProperty("/purchaseOrders", arr);
                            that.getView().byId("idHeaderTable").bindRows("/purchaseOrders");
                            that.getView().byId("idHeaderTable").setVisibleRowCount(arr.length || 1);
                            oModel.setProperty("/showReadResult", true);
                            oModel.setProperty("/showItemsTable", false);
                        })
                        .catch(function(){
                            MessageBox.error("Failed to load Purchase Orders");
                        });
                    return;
                }

                // Specific PO number → show header + items
                service.callService("/purchaseorderheader/" + poNumber, "GET", {})
                    .then(function(headerData){
                        if(!headerData || !headerData.poId){
                            MessageBox.error("PO Number not found");
                            oModel.setProperty("/showReadResult", false);
                            oModel.setProperty("/showItemsTable", false);
                            return;
                        }
                        oModel.setProperty("/purchaseOrders", [headerData]);
                        that.getView().byId("idHeaderTable").bindRows("/purchaseOrders");
                        that.getView().byId("idHeaderTable").setVisibleRowCount(1);

                        return service.callService("/purchaseorderitem", "GET", {})
                            .then(function(allItems){
                                var items = (allItems || []).filter(function(item){
                                    return item.purchaseOrder &&
                                           item.purchaseOrder.poId === parseInt(poNumber);
                                });
                                oModel.setProperty("/purchaseOrderItems", items);
                                that.getView().byId("idItemTable").bindRows("/purchaseOrderItems");
                                that.getView().byId("idItemTable").setVisibleRowCount(items.length || 1);
                                oModel.setProperty("/showReadResult", true);
                                oModel.setProperty("/showItemsTable", true);
                            });
                    })
                    .catch(function(err){
                        MessageBox.error("PO Number not found");
                        oModel.setProperty("/showReadResult", false);
                        oModel.setProperty("/showItemsTable", false);
                        console.error(err);
                    });
            },

            /* =========================
            UPDATE — SEARCH BY PO NUMBER
            ========================= */

            onSearchByPoNumber: function(){
                var oModel   = this.getView().getModel();
                var poNumber = oModel.getProperty("/searchPoNumber");
                var that     = this;

                if(!poNumber || String(poNumber).trim() === ""){
                    MessageBox.error("Please enter a PO Number");
                    return;
                }

                service.callService("/purchaseorderheader/" + poNumber, "GET", {})
                    .then(function(headerData){
                        if(!headerData || !headerData.poId){
                            MessageBox.error("PO Number not found");
                            oModel.setProperty("/showPoSearchResult", false);
                            return;
                        }
                        oModel.setProperty("/filteredPoHeader", [headerData]);

                        return service.callService("/purchaseorderitem", "GET", {})
                            .then(function(allItems){
                                var items = (allItems || []).filter(function(item){
                                    return item.purchaseOrder &&
                                           item.purchaseOrder.poId === parseInt(poNumber);
                                });
                                oModel.setProperty("/filteredPoItems", items);
                                oModel.setProperty("/showPoSearchResult", true);
                                that.getView().byId("updatePoItemsTable").setVisibleRowCount(items.length || 1);
                                that.getView().byId("updatePoHeaderTable").setVisibleRowCount(1);
                            });
                    })
                    .catch(function(err){
                        MessageBox.error("PO Number not found");
                        oModel.setProperty("/showPoSearchResult", false);
                        console.error(err);
                    });
            },

            /* =========================
            UPDATE — SAVE
            ========================= */

            onUpdateItem: function(){
                var oModel      = this.getView().getModel();
                var headerArray = oModel.getProperty("/filteredPoHeader");
                var header      = headerArray && headerArray[0];
                var items       = oModel.getProperty("/filteredPoItems");
                var that        = this;

                if(!header || !header.poId){
                    MessageBox.error("No Purchase Order loaded");
                    return;
                }

                var headerPayload = {
                    "poId":         header.poId,
                    "orderDate":    header.orderDate,
                    "deliveryDate": header.deliveryDate,
                    "vendor":       header.vendor
                };

                service.callService("/purchaseorderheader", "PUT", headerPayload)
                    .then(function(){
                        var chain = items.reduce(function(promiseChain, item){
                            return promiseChain.then(function(){
                                return service.callService(
                                    "/purchaseorderitem/" + item.poItemId,
                                    "PUT",
                                    { "quantity": parseInt(item.quantity) }
                                );
                            });
                        }, Promise.resolve());
                        return chain;
                    })
                    .then(function(){
                        MessageBox.success("Purchase Order updated successfully!");
                        that.onBack();
                    })
                    .catch(function(err){
                        MessageBox.error("Error updating Purchase Order");
                        console.error(err);
                    });
            },

            /* =========================
            UPDATE — CANCEL
            ========================= */

            onCancelItemEdit: function(){
                var oModel = this.getView().getModel();
                oModel.setProperty("/showPoSearchResult", false);
                oModel.setProperty("/searchPoNumber",     "");
                oModel.setProperty("/filteredPoHeader",   null);
                oModel.setProperty("/filteredPoItems",    []);
            },

            /* =========================
            RESET ALL DATA
            ========================= */

            resetAllData: function(){
                var oModel = this.getView().getModel();
                oModel.setProperty("/createPayload", {
                    "poId":         null,
                    "orderDate":    null,
                    "deliveryDate": null,
                    "vendor":       { "vendorId": null, "name": "" },
                    "items": [
                        { "material": "", "quantity": null, "uom": "" },
                        { "material": "", "quantity": null, "uom": "" },
                        { "material": "", "quantity": null, "uom": "" }
                    ]
                });
                this.getView().byId("createItemsTable").setVisibleRowCount(3);
                oModel.setProperty("/editItemPayload", {
                    "poItemId":      null,
                    "material":      "",
                    "quantity":      null,
                    "uom":           "",
                    "purchaseOrder": { "poId": null }
                });
                oModel.setProperty("/editItemMode",       false);
                oModel.setProperty("/searchItemId",       "");
                oModel.setProperty("/searchPoNumber",     "");
                oModel.setProperty("/readSearchPoNumber", "");
                oModel.setProperty("/filteredPoHeader",   null);
                oModel.setProperty("/filteredPoItems",    []);
                oModel.setProperty("/showReadResult",     false);
                oModel.setProperty("/showItemsTable",     false);
                oModel.setProperty("/showPoSearchResult", false);
                oModel.setProperty("/purchaseOrders",     []);
                oModel.setProperty("/purchaseOrderItems", []);
            }

        });
    }
);