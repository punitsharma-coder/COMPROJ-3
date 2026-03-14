// Developed by PUNIT 06-03-2026
sap.ui.define(
    ["sap/ui/core/mvc/Controller",
     "jquery.sap.global",
     "punit/util/service",
     "sap/m/MessageBox",
     "sap/m/Dialog",
     "sap/m/List",
     "sap/m/StandardListItem",
     "sap/ui/model/json/JSONModel"],

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
                        // ✅ NEW: items array replaces flat material/quantity/uom fields
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

                    "searchItemId": "",

                    "editItemMode":          false,
                    "showOperationSelector": true,
                    "showCreatePanel":       false,
                    "showReadPanel":         false,
                    "showUpdatePanel":       false
                });
                this.getView().setModel(oModel);
                
                this.loadCustomersForF4();
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
                    width: "600px",      // ← Wider for better UX
                    height: "500px",     // ← Taller to show more items
                    draggable: true,     // ← Allow dragging
                    resizable: true,     // ← Allow resizing
                    content: [
                        new List({
                            mode: "SingleSelectMaster",
                            growing: true,              // ← Enable growing/lazy loading
                            growingThreshold: 5,        // ← Load 5 items at a time
                            growingScrollToLoad: true,  // ← Load more on scroll
                            items: {
                                path: "/customerList",
                                template: new StandardListItem({
                                    title: "{name}",
                                    description: "ID: {customerId} | City: {city}"
                                })
                            }
                        })
                    ],
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
                // ✅ NEW: Clear dynamically added item blocks on back
                this._clearAdditionalItems();
            },

            // ─── CREATE ────────────────────────────────────────────

            // ✅ NEW: Adds a new item block below the existing ones
            onAddItem: function(){
                var oModel = this.getView().getModel();
                var items  = oModel.getProperty("/createPayload/items") || [];

                // Push a new empty item into the model array
                var newIndex = items.length;
                items.push({ "material": "", "quantity": null, "uom": "" });
                oModel.setProperty("/createPayload/items", items);

                // Inject the new item block into the VBox container
                var oContainer = this.getView().byId("additionalItemsContainer");
                var that       = this;

                var oTitleText = new sap.m.Title({ text: "Sales Order Item " + (newIndex + 1) });

                var oMaterialLabel = new sap.m.Label({ text: "Material" });
                var oMaterialInput = new sap.m.Input({
                    id:          "createItemMaterial_" + newIndex,
                    placeholder: "Enter material",
                    liveChange:  function(oEvt){
                        var current = oModel.getProperty("/createPayload/items");
                        current[newIndex].material = oEvt.getParameter("value");
                        oModel.setProperty("/createPayload/items", current);
                    }
                });

                var oQuantityLabel = new sap.m.Label({ text: "Quantity" });
                var oQuantityInput = new sap.m.Input({
                    id:          "createItemQuantity_" + newIndex,
                    placeholder: "Enter quantity",
                    type:        "Number",
                    liveChange:  function(oEvt){
                        var current = oModel.getProperty("/createPayload/items");
                        current[newIndex].quantity = oEvt.getParameter("value");
                        oModel.setProperty("/createPayload/items", current);
                    }
                });

                var oUomLabel = new sap.m.Label({ text: "UOM" });
                var oUomInput = new sap.m.Input({
                    id:          "createItemUom_" + newIndex,
                    placeholder: "Enter unit of measurement",
                    liveChange:  function(oEvt){
                        var current = oModel.getProperty("/createPayload/items");
                        current[newIndex].uom = oEvt.getParameter("value");
                        oModel.setProperty("/createPayload/items", current);
                    }
                });

                // Wrap new item fields in a VBox and add to the container
                var oItemVBox = new sap.m.VBox({
                    items: [
                        oTitleText,
                        oMaterialLabel,  oMaterialInput,
                        oQuantityLabel,  oQuantityInput,
                        oUomLabel,       oUomInput
                    ]
                });

                oContainer.addItem(oItemVBox);
            },

            // ✅ NEW: Clears all dynamically added item blocks
            _clearAdditionalItems: function(){
                var oContainer = this.getView().byId("additionalItemsContainer");
                if(oContainer){
                    oContainer.destroyItems();
                }
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

                // ✅ NEW: Item validation — check all items have material and quantity
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

                var soNumberEntered = oPayload.salesOrderNumber
                    ? String(oPayload.salesOrderNumber).trim()
                    : "";

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
                var that         = this;
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
                            "SO Number: "       + soNumber + "\n" +
                            "Items Created: "   + createdItems.length + "\n" +
                            "Item Numbers: "    + itemNumbers
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
                    // ✅ NEW: reset items back to one empty item
                    "items": [
                        { "material": "", "quantity": null, "uom": "" }
                    ]
                });
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