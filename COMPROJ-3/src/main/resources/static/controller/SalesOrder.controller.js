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
        return Controller.extend("punit.controller.SalesOrder", {

            onInit: function(){
                var oModel = new sap.ui.model.json.JSONModel();
                oModel.setData({
                    "createPayload": {
                        "salesOrderNumber": null,
                        "dateOfOrder":      null,
                        "dateOfDelivery":   null,
                        "customer":         { "customerId": null, "name": "" },
                        // items array — each row in the table is one object here
                        "items": [
                            { "material": "", "quantity": null, "uom": "" }
                        ]
                    },
                    "editItemPayload": {
                        "itemNumber":       null,
                        "material":         "",
                        "quantity":         null,
                        "uom":              "",
                        "salesOrderHeader": { "salesOrderNumber": null }
                    },
                    "salesOrders":     [],
                    "salesOrderItems": [],
                    "customerList":    [],
                    "productList":     [],
                    "searchItemId": "",
                    "editItemMode":          false,
                    "showOperationSelector": true,
                    "showCreatePanel":       false,
                    "showReadPanel":         false,
                    "showUpdatePanel":       false
                });
                this.getView().setModel(oModel);
                this.loadCustomersForF4();
                this.loadProductsForF4();
            },

            // ✅ Load all customers for F4 Help
            loadCustomersForF4: function(){
                var that = this;
                console.log("Starting to load customers for F4 Help...");
                service.callService("/customers/f4help", "GET", {})
                    .then(function(data){
                        console.log("=== API Response ===");
                        console.log("Response Data:", data);
                        console.log("Response Length:", data ? data.length : 0);
                        var oModel = that.getView().getModel();
                        var customerArray = Array.isArray(data) ? data : (data ? [data] : []);
                        console.log("Setting customerList with", customerArray.length, "customers");
                        oModel.setProperty("/customerList", customerArray);
                        var saved = oModel.getProperty("/customerList");
                        console.log("Verified - customerList now has:", saved.length, "customers");
                        console.log("Customer List:", saved);
                    })
                    .catch(function(err){
                        console.error("Error loading customers for F4 Help:", err);
                        MessageBox.error("Failed to load customers");
                    });
            },

            // ✅ Load all products for Material F4 Help
            loadProductsForF4: function(){
                var that = this;
                console.log("Starting to load products for F4 Help...");
                service.callService("/product", "GET", {})
                    .then(function(data){
                        console.log("=== Product API Response ===");
                        console.log("Response Data:", data);
                        console.log("Response Length:", data ? data.length : 0);
                        var oModel = that.getView().getModel();
                        var productArray = Array.isArray(data) ? data : (data ? [data] : []);
                        console.log("Setting productList with", productArray.length, "products");
                        oModel.setProperty("/productList", productArray);
                        var saved = oModel.getProperty("/productList");
                        console.log("Verified - productList now has:", saved.length, "products");
                        console.log("Product List:", saved);
                    })
                    .catch(function(err){
                        console.error("Error loading products for F4 Help:", err);
                        MessageBox.error("Failed to load products");
                    });
            },

            // ✅ Open F4 Help Dialog for Material — fills material (product.name) AND uom (product.uom)
            onMaterialF4Help: function(oEvent){
                var that    = this;
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

            // ✅ Open F4 Help Dialog for Customer - WITH SCROLLING
            onCustomerF4Help: function(){
                var that = this;
                var oModel = this.getView().getModel();
                var customerList = oModel.getProperty("/customerList") || [];
                console.log("=== F4 Help Dialog ===");
                console.log("Opening F4 Help with", customerList.length, "customers");
                console.log("Customer List:", customerList);
                if(!customerList || customerList.length === 0){
                    MessageBox.warning("No customers available. Please create customers first.");
                    return;
                }
                // ✅ FIXED: Create Dialog with scrollable content
                var oDialog = new Dialog({
                    title: "Customer Help",
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
                            path: "/customerList",
                            template: new StandardListItem({
                                title: "{name}",
                                description: "ID: {customerId} | City: {city}"
                            })
                        }
                    })],
                    beginButton: new sap.m.Button({
                        text: "Select",
                        press: function(){
                            var oList = oDialog.getContent()[0];
                            var oSelectedItem = oList.getSelectedItem();
                            console.log("Selected Item:", oSelectedItem);
                            if(!oSelectedItem){
                                MessageBox.warning("Please select a customer");
                                return;
                            }
                            var oSelectedCustomer = oSelectedItem.getBindingContext().getObject();
                            console.log("Selected Customer:", oSelectedCustomer);
                            console.log("Setting customer ID:", oSelectedCustomer.customerId);
                            console.log("Setting customer name:", oSelectedCustomer.name);
                            oModel.setProperty("/createPayload/customer", {
                                "customerId": oSelectedCustomer.customerId,
                                "name": oSelectedCustomer.name
                            });
                            console.log("Customer set in form");
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
                console.log("Opening dialog with model bound");
                oDialog.open();
            },

            // ─── OPERATION SELECTION ──────────────────────────────
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
                this.onLoadData();
            },

            onSelectUpdate: function(){
                var oModel = this.getView().getModel();
                oModel.setProperty("/showOperationSelector", false);
                oModel.setProperty("/showCreatePanel",       false);
                oModel.setProperty("/showReadPanel",         false);
                oModel.setProperty("/showUpdatePanel",       true);
                oModel.setProperty("/editItemMode",  false);
                oModel.setProperty("/searchItemId",  "");
            },

            // ─── BACK / GLOBAL ────────────────────────────────────
            onBack: function(){
                var oModel = this.getView().getModel();
                oModel.setProperty("/showOperationSelector", true);
                oModel.setProperty("/showCreatePanel",       false);
                oModel.setProperty("/showReadPanel",         false);
                oModel.setProperty("/showUpdatePanel",       false);
                this.resetAllData();
            },

            // ─── CREATE ────────────────────────────────────────────
            // ✅ CHANGED: onAddItem now just pushes to the model array.
            //    The table reacts automatically via its rows="{/createPayload/items}" binding.
            //    No more manual VBox injection into additionalItemsContainer.
            onAddItem: function(){
                var oModel = this.getView().getModel();
                var items = oModel.getProperty("/createPayload/items") || [];

                // Push a new empty item into the model array
                items.push({ "material": "", "quantity": null, "uom": "" });
                oModel.setProperty("/createPayload/items", items);

                // ✅ visibleRowCount does not support model binding on sap.ui.table.Table
                //    — must be set directly via the control API so table grows without a scrollbar
                this.getView().byId("createItemsTable").setVisibleRowCount(items.length);
            },

            onSaveCombined: function(){
                var oModel   = this.getView().getModel();
                var oPayload = oModel.getProperty("/createPayload");
                var that     = this;

                // Header validation
                if(!oPayload.dateOfOrder || !oPayload.customer || !oPayload.customer.customerId){
                    MessageBox.error("Please fill all required fields (Order Date, Customer ID)");
                    return;
                }

                // ✅ Item validation — check all items have material and quantity
                var items = oPayload.items || [];
                for(var i = 0; i < items.length; i++){
                    if(!items[i].material || String(items[i].material).trim() === ""){
                        MessageBox.error("Item " + (i + 1) + ": Material is required.");
                        return;
                    }
                    if(!items[i].quantity){
                        MessageBox.error("Item " + (i + 1) + ": Quantity is required.");
                        return;
                    }
                }

                var soNumberEntered = oPayload.salesOrderNumber ? String(oPayload.salesOrderNumber).trim() : "";
                if(soNumberEntered !== ""){
                    service.callService("/salesorderheader/" + soNumberEntered, "GET", {})
                        .then(function(existingHeader){
                            if(!existingHeader || !existingHeader.salesOrderNumber){
                                MessageBox.error("That SO Number doesn't exist. Please enter a valid SO Number or leave it blank to auto-generate.");
                                return;
                            }
                            // ✅ CHANGED: call _createAllItems instead of _createItemOnly
                            that._createAllItems(parseInt(existingHeader.salesOrderNumber), items);
                        })
                        .catch(function(err){
                            MessageBox.error("That SO Number doesn't exist. Please enter a valid SO Number or leave it blank to auto-generate.");
                            console.error(err);
                        });
                } else {
                    // ✅ CHANGED: call _createHeaderThenAllItems instead of _createHeaderThenItem
                    that._createHeaderThenAllItems(oPayload, items);
                }
            },

            // ✅ CHANGED: was _createHeaderThenItem — now passes items array
            _createHeaderThenAllItems: function(oPayload, items){
                var that = this;
                var headerPayload = {
                    "dateOfOrder":    oPayload.dateOfOrder,
                    "dateOfDelivery": oPayload.dateOfDelivery,
                    "customer":       { "customerId": oPayload.customer.customerId }
                };
                service.callService("/salesorderheader", "POST", headerPayload)
                    .then(function(headerResponse){
                        return that._createAllItems(parseInt(headerResponse.salesOrderNumber), items);
                    })
                    .catch(function(err){
                        MessageBox.error("Error: Failed to create Sales Order Header. Please try again.");
                        console.error(err);
                    });
            },

            // ✅ NEW: replaces _createItemOnly — loops through all items sequentially
            _createAllItems: function(soNumber, items){
                var that = this;
                var createdItems = [];
                // Chain each item POST one after another using reduce
                var chain = items.reduce(function(promiseChain, item){
                    return promiseChain.then(function(){
                        var itemPayload = {
                            "material":         item.material,
                            "quantity":         item.quantity ? parseInt(item.quantity) : null,
                            "uom":              item.uom,
                            "salesOrderHeader": { "salesOrderNumber": parseInt(soNumber) }
                        };
                        return service.callService("/salesorderitem", "POST", itemPayload)
                            .then(function(itemResponse){
                                createdItems.push(itemResponse);
                            });
                    });
                }, Promise.resolve());
                return chain
                    .then(function(){
                        var itemNumbers = createdItems.map(function(i){ return i.itemNumber; }).join(", ");
                        MessageBox.success(
                            "Sales Order created successfully!\n" +
                            "SO Number: " + soNumber + "\n" +
                            "Items Created: " + createdItems.length + "\n" +
                            "Item Numbers: " + itemNumbers
                        );
                        that.onBack();
                    })
                    .catch(function(err){
                        MessageBox.error("Error: Failed to create one or more SO Items. Please try again.");
                        console.error(err);
                    });
            },

            // ─── READ ──────────────────────────────────────────────
            onLoadData: function(){
                var that = this;
                service.callService("/salesorderheader", "GET", {})
                    .then(function(data){
                        var oModel = that.getView().getModel();
                        oModel.setProperty("/salesOrders", data || []);
                        that.getView().byId("idHeaderTable").bindRows("/salesOrders");
                    })
                    .catch(function(err){
                        MessageBox.error("Error loading SO Headers");
                        console.error(err);
                    });
                service.callService("/salesorderitem", "GET", {})
                    .then(function(data){
                        var oModel = that.getView().getModel();
                        oModel.setProperty("/salesOrderItems", data || []);
                        that.getView().byId("idItemTable").bindRows("/salesOrderItems");
                        MessageBox.information("Data loaded successfully");
                    })
                    .catch(function(err){
                        MessageBox.error("Error loading SO Items");
                        console.error(err);
                    });
            },

            // ─── UPDATE SO ITEM ────────────────────────────────────
            onSearchItem: function(){
                var oModel     = this.getView().getModel();
                var itemNumber = oModel.getProperty("/searchItemId");
                if(!itemNumber || String(itemNumber).trim() === ""){
                    MessageBox.error("Please enter an Item Number");
                    return;
                }
                service.callService("/salesorderitem/" + itemNumber, "GET", {})
                    .then(function(data){
                        if(!data || !data.itemNumber){
                            MessageBox.error("This Item Number doesn't exist");
                            oModel.setProperty("/editItemMode", false);
                            return;
                        }
                        oModel.setProperty("/editItemPayload", {
                            "itemNumber": data.itemNumber,
                            "material":   data.material,
                            "quantity":   data.quantity,
                            "uom":        data.uom,
                            "salesOrderHeader": data.salesOrderHeader || { "salesOrderNumber": null }
                        });
                        oModel.setProperty("/editItemMode", true);
                    })
                    .catch(function(err){
                        MessageBox.error("This Item Number doesn't exist");
                        oModel.setProperty("/editItemMode", false);
                        console.error(err);
                    });
            },

            onUpdateItem: function(){
                var oModel      = this.getView().getModel();
                var editPayload = oModel.getProperty("/editItemPayload");
                if(editPayload.quantity === null || editPayload.quantity === ""){
                    MessageBox.error("Please enter a valid Quantity");
                    return;
                }
                service.callService(
                    "/salesorderitem/" + editPayload.itemNumber,
                    "PUT",
                    { "quantity": parseInt(editPayload.quantity) }
                )
                .then(function(){
                    MessageBox.success("SO Item Updated Successfully");
                    this.onBack();
                }.bind(this))
                .catch(function(err){
                    MessageBox.error("Error: Failed to update SO Item");
                    console.error(err);
                });
            },

            onCancelItemEdit: function(){
                var oModel = this.getView().getModel();
                oModel.setProperty("/editItemMode",  false);
                oModel.setProperty("/searchItemId",  "");
                oModel.setProperty("/editItemPayload", {
                    "itemNumber":       null,
                    "material":         "",
                    "quantity":         null,
                    "uom":              "",
                    "salesOrderHeader": { "salesOrderNumber": null }
                });
            },

            // ─── RESET HELPERS ─────────────────────────────────────
            resetAllData: function(){
                var oModel = this.getView().getModel();
                oModel.setProperty("/createPayload", {
                    "salesOrderNumber": null,
                    "dateOfOrder":      null,
                    "dateOfDelivery":   null,
                    "customer":         { "customerId": null, "name": "" },
                    // ✅ reset items back to one empty item
                    "items": [
                        { "material": "", "quantity": null, "uom": "" }
                    ]
                });
                // ✅ reset visibleRowCount directly on the control back to 1
                this.getView().byId("createItemsTable").setVisibleRowCount(1);
                oModel.setProperty("/editItemPayload", {
                    "itemNumber":       null,
                    "material":         "",
                    "quantity":         null,
                    "uom":              "",
                    "salesOrderHeader": { "salesOrderNumber": null }
                });
                oModel.setProperty("/editItemMode", false);
                oModel.setProperty("/searchItemId", "");
            }

        });
    }
);