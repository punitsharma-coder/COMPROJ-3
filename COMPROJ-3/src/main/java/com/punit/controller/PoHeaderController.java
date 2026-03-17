package com.punit.controller;

import java.util.List;
import java.util.Optional;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import com.punit.entities.PoHeader;
import com.punit.service.PoHeaderService;

@RestController
public class PoHeaderController {

    @Autowired
    PoHeaderService headerService;

    // GET ALL PURCHASE ORDERS
    @GetMapping("/purchaseorderheader")
    public List<PoHeader> getAllPurchaseOrders() {
        return headerService.getAllPurchaseOrders();
    }

    // GET PURCHASE ORDER BY ID
    @GetMapping("/purchaseorderheader/{poId}")
    public PoHeader getPurchaseOrderById(@PathVariable("poId") Long id) {

        Optional<PoHeader> result = headerService.getPurchaseOrderById(id);

        if (!result.isPresent()) {
            return new PoHeader(); // return empty object if not found
        }

        return result.get();
    }

    // CREATE PURCHASE ORDER
    @PostMapping("/purchaseorderheader")
    public PoHeader createPurchaseOrder(@RequestBody PoHeader header) {
        return headerService.createPurchaseOrder(header);
    }

    // UPDATE PURCHASE ORDER
    @PutMapping("/purchaseorderheader")
    public PoHeader updatePurchaseOrder(@RequestBody PoHeader header) {
        return headerService.updatePurchaseOrder(header);
    }

    /*
     * // DELETE PURCHASE ORDER
     *
     * @DeleteMapping("/purchaseorderheader/{poId}")
     * public String deletePurchaseOrder(@PathVariable("poId") Long id) {
     *     return headerService.deletePurchaseOrder(id);
     * }
     */
}