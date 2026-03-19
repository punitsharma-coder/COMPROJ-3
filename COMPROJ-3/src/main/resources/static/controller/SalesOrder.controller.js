//Developed by Punit 17-03-2026 
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
                        "items": [
                            { "material": "", "quantity": null, "uom": "" },
                            { "material": "", "quantity": null, "uom": "" },
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
                    "salesOrders":           [],
                    "salesOrderItems":       [],
                    "customerList":          [],
                    "productList":           [],
                    "searchItemId":          "",
                    "searchSoNumber":        "",
                    "readSearchSoNumber":    "",
                    "filteredSoHeader":      null,
                    "filteredSoItems":       [],
                    "showReadResult":        false,
                    "showItemsTable":        false,
                    "showSoSearchResult":    false,
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

            /* =========================
            LOAD CUSTOMERS
            ========================= */

            loadCustomersForF4: function(){
                var that = this;
                service.callService("/customers/f4help", "GET", {})
                    .then(function(data){
                        var oModel        = that.getView().getModel();
                        var customerArray = Array.isArray(data) ? data : (data ? [data] : []);
                        oModel.setProperty("/customerList", customerArray);
                    })
                    .catch(function(){
                        MessageBox.error("Failed to load customers");
                    });
            },

            /* =========================
            LOAD PRODUCTS
            ========================= */

            loadProductsForF4: function(){
                var that = this;
                service.callService("/product", "GET", {})
                    .then(function(data){
                        var oModel       = that.getView().getModel();
                        var productArray = Array.isArray(data) ? data : (data ? [data] : []);
                        oModel.setProperty("/productList", productArray);
                    })
                    .catch(function(){
                        MessageBox.error("Failed to load products");
                    });
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
                                    "Material '" + oSelectedProduct.name + "' is already added in another row. Please select a different material."
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
            CUSTOMER F4 HELP (CREATE)
            ========================= */

            onCustomerF4Help: function(){
                var oModel       = this.getView().getModel();
                var customerList = oModel.getProperty("/customerList") || [];

                if(!customerList || customerList.length === 0){
                    MessageBox.warning("No customers available. Please create customers first.");
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
                            var oList             = oDialog.getContent()[0];
                            var oSelectedItem     = oList.getSelectedItem();
                            if(!oSelectedItem){
                                MessageBox.warning("Please select a customer");
                                return;
                            }
                            var oSelectedCustomer = oSelectedItem.getBindingContext().getObject();
                            oModel.setProperty("/createPayload/customer", {
                                "customerId": oSelectedCustomer.customerId,
                                "name":       oSelectedCustomer.name
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
            CUSTOMER F4 HELP (UPDATE)
            ========================= */

            onUpdateCustomerF4Help: function(){
                var oModel       = this.getView().getModel();
                var customerList = oModel.getProperty("/customerList") || [];

                if(!customerList || customerList.length === 0){
                    MessageBox.warning("No customers available. Please create customers first.");
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
                            var oList             = oDialog.getContent()[0];
                            var oSelectedItem     = oList.getSelectedItem();
                            if(!oSelectedItem){
                                MessageBox.warning("Please select a customer");
                                return;
                            }
                            var oSelectedCustomer = oSelectedItem.getBindingContext().getObject();
                            var headerArray       = oModel.getProperty("/filteredSoHeader");
                            headerArray[0].customer = {
                                customerId: oSelectedCustomer.customerId,
                                name:       oSelectedCustomer.name
                            };
                            oModel.setProperty("/filteredSoHeader", headerArray);
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
            SO NUMBER F4 HELP (READ)
            ========================= */

            onReadSoNumberF4Help: function(){
                var oModel = this.getView().getModel();
                var that   = this;

                service.callService("/salesorderheader", "GET", {})
                    .then(function(data){
                        var arr = Array.isArray(data) ? data : (data ? [data] : []);
                        oModel.setProperty("/salesOrders", arr);

                        if(!arr || arr.length === 0){
                            MessageBox.warning("No Sales Orders available.");
                            return;
                        }

                        var oDialog = new Dialog({
                            title: "Select SO Number",
                            contentWidth: "500px",
                            contentHeight: "300px",
                            verticalScrolling: true,
                            content: [new List({
                                mode: "SingleSelectMaster",
                                growing: true,
                                growingThreshold: 10,
                                growingScrollToLoad: true,
                                items: {
                                    path: "/salesOrders",
                                    template: new StandardListItem({
                                        title: "SO Number: {salesOrderNumber}",
                                        description: "Order Date: {dateOfOrder} | Customer: {customer/name}"
                                    })
                                }
                            })],
                            beginButton: new sap.m.Button({
                                text: "Select",
                                press: function(){
                                    var oList         = oDialog.getContent()[0];
                                    var oSelectedItem = oList.getSelectedItem();
                                    if(!oSelectedItem){
                                        MessageBox.warning("Please select a SO Number");
                                        return;
                                    }
                                    var oSelectedSo = oSelectedItem.getBindingContext().getObject();
                                    oModel.setProperty("/readSearchSoNumber", String(oSelectedSo.salesOrderNumber));
                                    oDialog.close();
                                    that.onReadSearchBySoNumber();
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
                        MessageBox.error("Failed to load Sales Orders");
                    });
            },

            /* =========================
            SO NUMBER F4 HELP (UPDATE)
            ========================= */

            onUpdateSoNumberF4Help: function(){
                var oModel = this.getView().getModel();
                var that   = this;

                service.callService("/salesorderheader", "GET", {})
                    .then(function(data){
                        var arr = Array.isArray(data) ? data : (data ? [data] : []);
                        oModel.setProperty("/salesOrders", arr);

                        if(!arr || arr.length === 0){
                            MessageBox.warning("No Sales Orders available.");
                            return;
                        }

                        var oDialog = new Dialog({
                            title: "Select SO Number",
                            contentWidth: "500px",
                            contentHeight: "300px",
                            verticalScrolling: true,
                            content: [new List({
                                mode: "SingleSelectMaster",
                                growing: true,
                                growingThreshold: 10,
                                growingScrollToLoad: true,
                                items: {
                                    path: "/salesOrders",
                                    template: new StandardListItem({
                                        title: "SO Number: {salesOrderNumber}",
                                        description: "Order Date: {dateOfOrder} | Customer: {customer/name}"
                                    })
                                }
                            })],
                            beginButton: new sap.m.Button({
                                text: "Select",
                                press: function(){
                                    var oList         = oDialog.getContent()[0];
                                    var oSelectedItem = oList.getSelectedItem();
                                    if(!oSelectedItem){
                                        MessageBox.warning("Please select a SO Number");
                                        return;
                                    }
                                    var oSelectedSo = oSelectedItem.getBindingContext().getObject();
                                    oModel.setProperty("/searchSoNumber", String(oSelectedSo.salesOrderNumber));
                                    oDialog.close();
                                    that.onSearchBySoNumber();
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
                        MessageBox.error("Failed to load Sales Orders");
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
                // ✅ Reset everything — tables hidden, user must click Search
                oModel.setProperty("/showReadResult",        false);
                oModel.setProperty("/showItemsTable",        false);
                oModel.setProperty("/readSearchSoNumber",    "");
                oModel.setProperty("/salesOrders",           []);
                oModel.setProperty("/salesOrderItems",       []);
            },

            onSelectUpdate: function(){
                var oModel = this.getView().getModel();
                oModel.setProperty("/showOperationSelector", false);
                oModel.setProperty("/showCreatePanel",       false);
                oModel.setProperty("/showReadPanel",         false);
                oModel.setProperty("/showUpdatePanel",       true);
                oModel.setProperty("/editItemMode",          false);
                oModel.setProperty("/searchSoNumber",        "");
                oModel.setProperty("/showSoSearchResult",    false);
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
			    /*var oRouter = sap.ui.core.UIComponent.getRouterFor(this);
			    oRouter.navTo("RouteHome");*/ 
				this.getOwnerComponent().getRouter().navTo("RouteHome");
			},

            /* =========================
            CREATE — SAVE
            ========================= */

            onSaveCombined: function(){
                var oModel   = this.getView().getModel();
                var oPayload = oModel.getProperty("/createPayload");
                var that     = this;

                if(!oPayload.dateOfOrder || !oPayload.customer || !oPayload.customer.customerId){
                    MessageBox.error("Please fill all required fields (Order Date, Customer ID)");
                    return;
                }

                // Filter out empty rows
                var items = (oPayload.items || []).filter(function(item){
                    return item.material && String(item.material).trim() !== "" && item.quantity;
                });

                if(items.length === 0){
                    MessageBox.error("Please fill in at least one item row completely.");
                    return;
                }

                var soNumberEntered = oPayload.salesOrderNumber ? String(oPayload.salesOrderNumber).trim() : "";
                if(soNumberEntered !== ""){
                    service.callService("/salesorderheader/" + soNumberEntered, "GET", {})
                        .then(function(existingHeader){
                            if(!existingHeader || !existingHeader.salesOrderNumber){
                                MessageBox.error("That SO Number doesn't exist. Please enter a valid SO Number or leave it blank to auto-generate.");
                                return;
                            }
                            that._createAllItems(parseInt(existingHeader.salesOrderNumber), items);
                        })
                        .catch(function(err){
                            MessageBox.error("That SO Number doesn't exist. Please enter a valid SO Number or leave it blank to auto-generate.");
                            console.error(err);
                        });
                } else {
                    that._createHeaderThenAllItems(oPayload, items);
                }
            },

            _createHeaderThenAllItems: function(oPayload, items){
                var that          = this;
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

            _createAllItems: function(soNumber, items){
                var that         = this;
                var createdItems = [];

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

            /* =========================
            READ — SEARCH BY SO NUMBER
            ========================= */

            onReadSearchBySoNumber: function(){
                var oModel   = this.getView().getModel();
                var soNumber = oModel.getProperty("/readSearchSoNumber");
                var that     = this;

                // ✅ Empty field → show all headers only, no items
                if(!soNumber || String(soNumber).trim() === ""){
                    service.callService("/salesorderheader", "GET", {})
                        .then(function(data){
                            var arr = Array.isArray(data) ? data : (data ? [data] : []);
							arr.sort(function(a, b){ return a.salesOrderNumber - b.salesOrderNumber; });
                            oModel.setProperty("/salesOrders", arr);
                            that.getView().byId("idHeaderTable").bindRows("/salesOrders");
                            that.getView().byId("idHeaderTable").setVisibleRowCount(arr.length || 1);
                            oModel.setProperty("/showReadResult", true);
                            oModel.setProperty("/showItemsTable", false);
                        })
                        .catch(function(){
                            MessageBox.error("Failed to load Sales Orders");
                        });
                    return;
                }

                // ✅ SO number entered → show header + items for that SO
                service.callService("/salesorderheader/" + soNumber, "GET", {})
                    .then(function(headerData){
                        if(!headerData || !headerData.salesOrderNumber){
                            MessageBox.error("SO Number not found");
                            oModel.setProperty("/showReadResult", false);
                            oModel.setProperty("/showItemsTable", false);
                            return;
                        }
                        oModel.setProperty("/salesOrders", [headerData]);
                        that.getView().byId("idHeaderTable").bindRows("/salesOrders");
                        that.getView().byId("idHeaderTable").setVisibleRowCount(1);

                        return service.callService("/salesorderitem", "GET", {})
                            .then(function(allItems){
                                var items = (allItems || []).filter(function(item){
                                    return item.salesOrderHeader &&
                                           item.salesOrderHeader.salesOrderNumber === parseInt(soNumber);
                                });
                                oModel.setProperty("/salesOrderItems", items);
                                that.getView().byId("idItemTable").bindRows("/salesOrderItems");
                                that.getView().byId("idItemTable").setVisibleRowCount(items.length || 1);
                                oModel.setProperty("/showReadResult", true);
                                oModel.setProperty("/showItemsTable", true);
                            });
                    })
                    .catch(function(err){
                        MessageBox.error("SO Number not found");
                        oModel.setProperty("/showReadResult", false);
                        oModel.setProperty("/showItemsTable", false);
                        console.error(err);
                    });
            },

            /* =========================
            UPDATE — SEARCH BY SO NUMBER
            ========================= */

            onSearchBySoNumber: function(){
                var oModel   = this.getView().getModel();
                var soNumber = oModel.getProperty("/searchSoNumber");
                var that     = this;

                if(!soNumber || String(soNumber).trim() === ""){
                    MessageBox.error("Please enter a SO Number");
                    return;
                }

                service.callService("/salesorderheader/" + soNumber, "GET", {})
                    .then(function(headerData){
                        if(!headerData || !headerData.salesOrderNumber){
                            MessageBox.error("SO Number not found");
                            oModel.setProperty("/showSoSearchResult", false);
                            return;
                        }
                        oModel.setProperty("/filteredSoHeader", [headerData]);

                        return service.callService("/salesorderitem", "GET", {})
                            .then(function(allItems){
                                var items = (allItems || []).filter(function(item){
                                    return item.salesOrderHeader &&
                                           item.salesOrderHeader.salesOrderNumber === parseInt(soNumber);
                                });
                                oModel.setProperty("/filteredSoItems", items);
                                oModel.setProperty("/showSoSearchResult", true);
                                that.getView().byId("updateItemsTable").setVisibleRowCount(items.length || 1);
                                that.getView().byId("updateHeaderTable").setVisibleRowCount(1);
                            });
                    })
                    .catch(function(err){
                        MessageBox.error("SO Number not found");
                        oModel.setProperty("/showSoSearchResult", false);
                        console.error(err);
                    });
            },

            /* =========================
            UPDATE — SAVE
            ========================= */

            onUpdateItem: function(){
                var oModel      = this.getView().getModel();
                var headerArray = oModel.getProperty("/filteredSoHeader");
                var header      = headerArray && headerArray[0];
                var items       = oModel.getProperty("/filteredSoItems");
                var that        = this;

                if(!header || !header.salesOrderNumber){
                    MessageBox.error("No Sales Order loaded");
                    return;
                }

                var headerPayload = {
                    "salesOrderNumber": header.salesOrderNumber,
                    "dateOfOrder":      header.dateOfOrder,
                    "dateOfDelivery":   header.dateOfDelivery,
                    "customer":         header.customer
                };

                service.callService("/salesorderheader", "PUT", headerPayload)
                    .then(function(){
                        var chain = items.reduce(function(promiseChain, item){
                            return promiseChain.then(function(){
                                return service.callService(
                                    "/salesorderitem/" + item.itemNumber,
                                    "PUT",
                                    { "quantity": parseInt(item.quantity) }
                                );
                            });
                        }, Promise.resolve());
                        return chain;
                    })
                    .then(function(){
                        MessageBox.success("Sales Order updated successfully!");
                        that.onBack();
                    })
                    .catch(function(err){
                        MessageBox.error("Error updating Sales Order");
                        console.error(err);
                    });
            },

            /* =========================
            UPDATE — CANCEL
            ========================= */

            onCancelItemEdit: function(){
                var oModel = this.getView().getModel();
                oModel.setProperty("/showSoSearchResult", false);
                oModel.setProperty("/searchSoNumber",     "");
                oModel.setProperty("/filteredSoHeader",   null);
                oModel.setProperty("/filteredSoItems",    []);
            },

            /* =========================
            RESET ALL DATA
            ========================= */

            resetAllData: function(){
                var oModel = this.getView().getModel();
                oModel.setProperty("/createPayload", {
                    "salesOrderNumber": null,
                    "dateOfOrder":      null,
                    "dateOfDelivery":   null,
                    "customer":         { "customerId": null, "name": "" },
                    "items": [
                        { "material": "", "quantity": null, "uom": "" },
                        { "material": "", "quantity": null, "uom": "" },
                        { "material": "", "quantity": null, "uom": "" }
                    ]
                });
                this.getView().byId("createItemsTable").setVisibleRowCount(3);
                oModel.setProperty("/editItemPayload", {
                    "itemNumber":       null,
                    "material":         "",
                    "quantity":         null,
                    "uom":              "",
                    "salesOrderHeader": { "salesOrderNumber": null }
                });
                oModel.setProperty("/editItemMode",       false);
                oModel.setProperty("/searchItemId",       "");
                oModel.setProperty("/searchSoNumber",     "");
                oModel.setProperty("/readSearchSoNumber", "");
                oModel.setProperty("/filteredSoHeader",   null);
                oModel.setProperty("/filteredSoItems",    []);
                oModel.setProperty("/showReadResult",     false);
                oModel.setProperty("/showItemsTable",     false);
                oModel.setProperty("/showSoSearchResult", false);
                oModel.setProperty("/salesOrders",        []);
                oModel.setProperty("/salesOrderItems",    []);
            }

        });
    }
);