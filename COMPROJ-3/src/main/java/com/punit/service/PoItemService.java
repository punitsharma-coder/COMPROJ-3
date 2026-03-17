package com.punit.service;

import java.util.List;
import java.util.Optional;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.punit.entities.PoHeader;
import com.punit.entities.PoItem;
import com.punit.repository.IPoHeaderPersistence;
import com.punit.repository.IPoItemPersistence;

@Service
public class PoItemService {

    @Autowired
    IPoItemPersistence itemRepo;

    @Autowired
    IPoHeaderPersistence headerRepo;

    // READ ALL
    public List<PoItem> getAllItems() {
        return itemRepo.findAll();
    }

    // READ ONE
    public Optional<PoItem> getItemById(Long id) {
        return itemRepo.findById(id);
    }

    // CREATE
    public PoItem createItem(PoItem obj) {

        // auto-generate item id
        obj.setPoItemId(null);

        Long poId = obj.getPurchaseOrder().getPoId();

        PoHeader realHeader = headerRepo.findById(poId)
            .orElseThrow(() ->
                new RuntimeException("Purchase Order not found: " + poId)
            );

        obj.setPurchaseOrder(realHeader);

        return itemRepo.save(obj);
    }

    // UPDATE (only quantity allowed)
    public PoItem updateItem(Long poItemId, PoItem payload) {

        PoItem existing = itemRepo.findById(poItemId)
            .orElseThrow(() ->
                new RuntimeException("PO Item not found: " + poItemId)
            );

        existing.setQuantity(payload.getQuantity());

        return itemRepo.save(existing);
    }
}