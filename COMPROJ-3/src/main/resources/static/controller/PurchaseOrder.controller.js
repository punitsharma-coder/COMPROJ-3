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
    function(Controller, jQuery, service, MessageBox, Dialog, List, StandardListItem, JSONModel) {

        return Controller.extend("punit.controller.PurchaseOrder", {

            onInit: function() {

                var oModel = new JSONModel();

                oModel.setData({
                    "createPayload": {
						"poId": null,
                        "orderDate":    null,
                        "deliveryDate": null,
                        "vendor": {
                            "vendorId": null,
                            "name": ""
                        },
                        "items": [
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
                    "searchItemId":          "",
                    "editItemMode":          false,
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

            loadVendorsForF4: function() {
                var that = this;
                service.callService("/vendors", "GET", {})
                    .then(function(data) {
						var oModel = that.getView().getModel();
                        var arr = Array.isArray(data) ? data : (data ? [data] : []);
						
                        oModel.setProperty("/vendorList", arr);
                    })
                    .catch(function(err) {
                        MessageBox.error("Failed to load vendors");
                    });
            },

            /* =========================
            LOAD PRODUCTS
            ========================= */

            loadProductsForF4: function() {
                var that = this;
                service.callService("/product", "GET", {})
                    .then(function(data) {
						var oModel = that.getView().getModel();
                        var arr = Array.isArray(data) ? data : (data ? [data] : []);
                        oModel.setProperty("/productList", arr);
                    })
                    .catch(function(err) {
                        MessageBox.error("Failed to load products");
                    });
            },

            /* =========================
            VENDOR F4 HELP
            ========================= */

            onVendorF4Help: function() {
				
                var oModel = this.getView().getModel();

                var vendorList = oModel.getProperty("/vendorList") || [];
                if (!vendorList || vendorList.length === 0) {
                    MessageBox.warning("No vendors available. Please create vendors first.");
                    return;
                }

				var dialog = new Dialog({
                    title: "Select Vendor",
                    contentWidth: "500px",
                    contentHeight: "300px",
                    verticalScrolling: true,
                    content: [
                        new List({
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
                        })
                    ],
                    beginButton: new sap.m.Button({
                        text: "Select",
                        press: function() {
                            var olist = dialog.getContent()[0];
                            var oSelectedItem  = olist.getSelectedItem();
                            if (!oSelectedItem) {
                                MessageBox.warning("Please select a vendor");
                                return;
                            }
                            var oSelectedVendor = oSelectedItem.getBindingContext().getObject();
							oModel.setProperty("/createPayload/vendor", {
								"vendorId": oSelectedVendor.vendorId,
							    "name": oSelectedVendor.name
							})
                           
                            dialog.close();
                        }
                    }),
                    endButton: new sap.m.Button({
                        text: "Cancel",
                        press: function() { dialog.close(); }
                    })
                });

                dialog.setModel(oModel);
                dialog.open();
            },

            /* =========================
            MATERIAL F4 HELP
            ========================= */

			onMaterialF4Help: function(oEvent){
			                
			                var oModel  = this.getView().getModel();
			                var productList = oModel.getProperty("/productList") || [];
			                console.log("=== Material F4 Help Dialog ===");
			                console.log("Opening Material F4 Help with", productList.length, "products");
			                if(!productList || productList.length === 0){
			                    MessageBox.warning("No products available. Please create products first.");
			                    return;
			                }

			                // ✅ Get the row index from the button's binding context so we know which item to update
			                var oButton     = oEvent.getSource();
			                var oContext    = oButton.getBindingContext();
			                var sPath       = oContext ? oContext.getPath() : null;   // e.g. "/createPayload/items/0"
			                var iRowIndex   = sPath ? parseInt(sPath.split("/").pop()) : null;
			                console.log("Material F4 triggered for row index:", iRowIndex);

			                var oDialog = new Dialog({
			                    title: "Select Material",
			                    width: "600px",
			                    height: "500px",
			                    draggable: true,
			                    resizable: true,
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
			                            console.log("Selected Item:", oSelectedItem);
			                            if(!oSelectedItem){
			                                MessageBox.warning("Please select a material");
			                                return;
			                            }
			                            var oSelectedProduct = oSelectedItem.getBindingContext().getObject();
			                            console.log("Selected Product:", oSelectedProduct);
			                            console.log("Setting material:", oSelectedProduct.name);
			                            console.log("Auto-filling UOM:", oSelectedProduct.uom);

			                            // ✅ Duplicate check — same material cannot be added twice
			                            var aItems = oModel.getProperty("/createPayload/items");
			                            var bAlreadyExists = aItems.some(function(oItem, iIndex){
			                                // skip the current row itself when checking
			                                return iIndex !== iRowIndex && oItem.material === oSelectedProduct.name;
			                            });
			                            if(bAlreadyExists){
			                                MessageBox.warning(
			                                    "Material '" + oSelectedProduct.name + "' is already added in another row. Please select a different material."
			                                );
			                                // dialog stays open — user can pick again
			                                return;
			                            }

			                            // ✅ Update the correct row in the items array
			                            if(iRowIndex !== null && aItems[iRowIndex] !== undefined){
			                                aItems[iRowIndex].material = oSelectedProduct.name;
			                                // ✅ Auto-fill UOM from product — saves the user an extra step
			                                aItems[iRowIndex].uom = oSelectedProduct.uom;
			                                oModel.setProperty("/createPayload/items", aItems);
			                            }
			                            oDialog.close();
			                        }
			                    }),
			                    endButton: new sap.m.Button({
			                        text: "Cancel",
			                        press: function(){
			                            oDialog.close();
			                        }
			                    })
			                });
			                oDialog.setModel(oModel);
			                console.log("Opening material dialog with model bound");
			                oDialog.open();
			            },

            /* =========================
            OPERATION BUTTONS
            ========================= */

            onSelectCreate: function() {
                var m = this.getView().getModel();
                m.setProperty("/showOperationSelector", false);
                m.setProperty("/showCreatePanel",       true);
                m.setProperty("/showReadPanel",         false);
                m.setProperty("/showUpdatePanel",       false);
            },

            onSelectRead: function() {
                var m = this.getView().getModel();
                m.setProperty("/showOperationSelector", false);
                m.setProperty("/showCreatePanel",       false);
                m.setProperty("/showReadPanel",         true);
                m.setProperty("/showUpdatePanel",       false);
                this.onLoadData();
            },

            onSelectUpdate: function() {
                var m = this.getView().getModel();
                m.setProperty("/showOperationSelector", false);
                m.setProperty("/showCreatePanel",       false);
                m.setProperty("/showReadPanel",         false);
                m.setProperty("/showUpdatePanel",       true);
                m.setProperty("/editItemMode",  false);
                m.setProperty("/searchItemId",  "");
            },
			// BACK / GLOBAL 
            onBack: function(){
                var oModel = this.getView().getModel();
                oModel.setProperty("/showOperationSelector", true);
                oModel.setProperty("/showCreatePanel",       false);
                oModel.setProperty("/showReadPanel",         false);
                oModel.setProperty("/showUpdatePanel",       false);
                this.resetAllData();
            },

            /* =========================
            ADD ITEM ROW
            ========================= */

            onAddItem: function() {
                var m     = this.getView().getModel();
                var items = m.getProperty("/createPayload/items");
                items.push({ "material": "", "quantity": null, "uom": "" });
                m.setProperty("/createPayload/items", items);
                this.getView().byId("createItemsTable").setVisibleRowCount(items.length);
            },

            /* =========================
            SAVE PURCHASE ORDER
            Step 1: POST header only (no items)
            Step 2: POST each item separately via _createAllPoItems
            ========================= */

            onSaveCombined: function() {
                var oModel  = this.getView().getModel();
                var payload = oModel.getProperty("/createPayload");
                var that    = this;

                if (!payload.orderDate || !payload.vendor || !payload.vendor.vendorId) {
                    MessageBox.error("Order Date and Vendor are required.");
                    return;
                }

                var items = payload.items || [];
                for (var i = 0; i < items.length; i++) {
                    if (!items[i].material || String(items[i].material).trim() === "") {
                        MessageBox.error("Item " + (i + 1) + ": Material is required.");
                        return;
                    }
                    if (!items[i].quantity) {
                        MessageBox.error("Item " + (i + 1) + ": Quantity is required.");
                        return;
                    }
                }
				
				var poIdEntered = payload.poId ? String(payload.poId).trim() : "";
                if(poIdEntered !== ""){
                    service.callService("/purchaseorderheader/" + poIdEntered, "GET", {})
                        .then(function(existingHeader){
                            if(!existingHeader || !existingHeader.poId){
                                MessageBox.error("That PO Number doesn't exist. Please enter a valid SO Number or leave it blank to auto-generate.");
                                return;
                            }
                            // ✅ CHANGED: call _createAllItems instead of _createItemOnly
                            that._createAllItems(parseInt(existingHeader.poId), items);
                        })
                        .catch(function(err){
                            MessageBox.error("That PO Number doesn't exist. Please enter a valid SO Number or leave it blank to auto-generate.");
                            console.error(err);
                        });
                } else {
                    // ✅ CHANGED: call _createHeaderThenAllItems instead of _createHeaderThenItem
                    that._createHeaderThenAllItems(payload, items);
                }
            },

            /* =========================
            STEP 1: POST HEADER ONLY
            ========================= */

            _createHeaderThenAllItems: function(payload, items) {
                var that = this;

                var headerPayload = {
                    "orderDate":    payload.orderDate,
                    "deliveryDate": payload.deliveryDate,
                    "vendor":        { "vendorId": payload.vendor.vendorId }
                };

                service.callService("/purchaseorderheader", "POST", headerPayload)
                    .then(function(headerResponse) {
                        return that._createAllPoItems(headerResponse.poId, items);
                    })
                    .catch(function(err) {
                        MessageBox.error("Error creating Purchase Order Header.");
                        console.error(err);
                    });
            },

            /* =========================
            STEP 2: POST ITEMS ONE BY ONE
            ========================= */

            _createAllPoItems: function(poId, items) {
                var that         = this;
                var createdItems = [];

                var chain = items.reduce(function(promiseChain, item) {
                    return promiseChain.then(function() {
                        var itemPayload = {
                            "material":      item.material,
                            "quantity":      item.quantity ? parseInt(item.quantity) : null,
                            "uom":           item.uom,
                            "purchaseOrder": { "poId": parseInt(poId) }
                        };
                        return service.callService("/purchaseorderitem", "POST", itemPayload)
                            .then(function(itemResponse) {
                                createdItems.push(itemResponse);
                            });
                    });
                }, Promise.resolve());

                return chain
                    .then(function() {
                        var itemIds = createdItems.map(function(i) { return i.poItemId; }).join(", ");
                        MessageBox.success(
                            "Purchase Order created successfully!\n" +
                            "PO ID: " + poId + "\n" +
                            "Items Created: " + createdItems.length + "\n" +
                            "Item IDs: " + itemIds
                        );
                        that.onBack();
                    })
                    .catch(function(err) {
                        MessageBox.error("Error creating one or more PO Items.");
                        console.error(err);
                    });
            },

            /* =========================
            LOAD DATA
            ========================= */

            onLoadData: function() {
                var that = this;

                service.callService("/purchaseorderheader", "GET", {})
                    .then(function(data) {
                        var m   = that.getView().getModel();
                        m.setProperty("/purchaseOrders", data || []);
                        that.getView().byId("idHeaderTable").bindRows("/purchaseOrders");
                    })
                    .catch(function(err) {
                        MessageBox.error("Error loading PO Headers");
                        console.error(err);
                    });

                service.callService("/purchaseorderitem", "GET", {})
                    .then(function(data) {
                        var m   = that.getView().getModel();
                        m.setProperty("/purchaseOrderItems", data || []);
                        that.getView().byId("idItemTable").bindRows("/purchaseOrderItems");
                    })
                    .catch(function(err) {
                        MessageBox.error("Error loading PO Items");
                        console.error(err);
                    });
            },

            /* =========================
            UPDATE — SEARCH ITEM
            ========================= */

            onSearchItem: function() {
                
                var oModel = this.getView().getModel();
                var itemId = oModel.getProperty("/searchItemId");

                if (!itemId || String(itemId).trim() === "") {
                    MessageBox.error("Please enter an Item ID");
                    return;
                }

                service.callService("/purchaseorderitem/" + itemId, "GET", {})
                    .then(function(data) {
                        if (!data || !data.poItemId) {
                            MessageBox.error("Item not found");
                            oModel.setProperty("/editItemMode", false);
                            return;
                        }
                        oModel.setProperty("/editItemPayload", {
                            "poItemId":      data.poItemId,
                            "material":      data.material,
                            "quantity":      data.quantity,
                            "uom":           data.uom,
                            "purchaseOrder": data.purchaseOrder || { "poId": null }
                        });
                        oModel.setProperty("/editItemMode", true);
                    })
                    .catch(function(err) {
                        MessageBox.error("Item not found");
                        oModel.setProperty("/editItemMode", false);
                        console.error(err);
                    });
            },

            /* =========================
            UPDATE — SAVE ITEM
            ========================= */

            onUpdateItem: function() {
                var oModel      = this.getView().getModel();
                var editPayload = oModel.getProperty("/editItemPayload");

                if (!editPayload.quantity=== null || editPayload.quantity === "") {
                    MessageBox.error("Please enter a valid Quantity");
                    return;
                }

                service.callService(
                    "/purchaseorderitem/" + editPayload.poItemId,
                    "PUT",
                    { "quantity": parseInt(editPayload.quantity) }
                )
                .then(function() {
                    MessageBox.success("PO Item Updated Successfully");
                    this.onBack();
                }.bind(this))
                .catch(function(err) {
                    MessageBox.error("Error updating PO Item");
                    console.error(err);
                });
            },

            /* =========================
            UPDATE — CANCEL EDIT
            ========================= */

            onCancelItemEdit: function() {
                var oModel = this.getView().getModel();
                oModel.setProperty("/editItemMode",  false);
                oModel.setProperty("/searchItemId",  "");
                oModel.setProperty("/editItemPayload", {
                    "poItemId":      null,
                    "material":      "",
                    "quantity":      null,
                    "uom":           "",
                    "purchaseOrder": { "poId": null }
                });
            },

            /* =========================
            RESET FORM
            ========================= */

            resetAllData: function() {
                var m = this.getView().getModel();
                m.setProperty("/createPayload", {
                    "orderDate":    null,
                    "deliveryDate": null,
                    "vendor": { "vendorId": null, "name": "" },
                    "items": [
                        { "material": "", "quantity": null, "uom": "" }
                    ]
                });
                this.getView().byId("createItemsTable").setVisibleRowCount(1);
                m.setProperty("/editItemPayload", {
                    "poItemId":      null,
                    "material":      "",
                    "quantity":      null,
                    "uom":           "",
                    "purchaseOrder": { "poId": null }
                });
                m.setProperty("/editItemMode",  false);
                m.setProperty("/searchItemId",  "");
            }

        });
    });