package com.punit.controller;

import java.util.List;
import java.util.Optional;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import com.punit.entities.PoItem;
import com.punit.service.PoItemService;

@RestController
public class PoItemController {

    @Autowired
    PoItemService itemService;

    // GET ALL PO ITEMS
    @GetMapping("/purchaseorderitem")
    public List<PoItem> getAllItems() {
        return itemService.getAllItems();
    }

    // GET ITEM BY ID
    @GetMapping("/purchaseorderitem/{poItemId}")
    public PoItem getItemById(@PathVariable("poItemId") Long poItemId) {

        Optional<PoItem> result = itemService.getItemById(poItemId);

        if (!result.isPresent()) {
            return new PoItem(); // return empty object if not found
        }

        return result.get();
    }

    // CREATE PO ITEM
    @PostMapping("/purchaseorderitem")
    public PoItem createItem(@RequestBody PoItem item) {
        return itemService.createItem(item);
    }

    // UPDATE PO ITEM
    @PutMapping("/purchaseorderitem/{poItemId}")
    public PoItem updateItem(
            @PathVariable("poItemId") Long poItemId,
            @RequestBody PoItem item) {

        return itemService.updateItem(poItemId, item);
    }

    /*
     * // DELETE PO ITEM
     *
     * @DeleteMapping("/purchaseorderitem/{poItemId}")
     * public String deleteItem(@PathVariable("poItemId") Long poItemId) {
     *     return itemService.deleteItem(poItemId);
     * }
     */
}