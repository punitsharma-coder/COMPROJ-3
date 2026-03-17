package com.punit.service;

import java.util.List;
import java.util.Optional;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.punit.entities.PoHeader;
import com.punit.entities.PoItem;
import com.punit.repository.IPoHeaderPersistence;
import com.punit.repository.IVendorPersistence;

@Service
public class PoHeaderService {

    @Autowired
    IPoHeaderPersistence headerRepo;

    @Autowired
    IVendorPersistence vendorRepo;

    // READ ALL
    public List<PoHeader> getAllPurchaseOrders() {
        return headerRepo.findAll();
    }

    // READ ONE
    public Optional<PoHeader> getPurchaseOrderById(Long id) {
        return headerRepo.findById(id);
    }

    // CREATE
    public PoHeader createPurchaseOrder(PoHeader obj) {

        // Check 1: Vendor must exist in request
        if (obj.getVendor() == null || obj.getVendor().getVendorId() == null) {
            throw new RuntimeException("Vendor is required to create a Purchase Order");
        }

        // Check 2: Vendor must exist in DB
        boolean vendorExists = vendorRepo.existsById(obj.getVendor().getVendorId());
        if (!vendorExists) {
            throw new RuntimeException(
                "Vendor not found with ID: " + obj.getVendor().getVendorId()
            );
        }

        // Let DB auto-generate PO ID
        obj.setPoId(null);

        // ✅ Link each item back to header and assign itemNo sequentially
        if (obj.getItems() != null) {
            for (PoItem item : obj.getItems()) {
                item.setPoItemId(null);          // let DB auto-generate item IDs
                item.setPurchaseOrder(obj);       // link item back to header
            }
        }

        return headerRepo.save(obj);
    }

    // UPDATE
    public PoHeader updatePurchaseOrder(PoHeader payload) {

        Optional<PoHeader> existing = headerRepo.findById(payload.getPoId());

        if (!existing.isPresent()) {
            return new PoHeader();
        }

        return headerRepo.save(payload);
    }

    // DELETE
    public String deletePurchaseOrder(Long id) {

        Optional<PoHeader> existing = headerRepo.findById(id);

        if (!existing.isPresent()) {
            return "Purchase Order Not Found";
        }

        headerRepo.deleteById(id);

        return "Purchase Order Deleted Successfully";
        // cascade = CascadeType.ALL will delete items automatically
    }
}