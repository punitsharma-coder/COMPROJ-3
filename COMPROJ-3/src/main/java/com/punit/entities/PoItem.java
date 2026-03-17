package com.punit.entities;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

import jakarta.persistence.*;

@Entity
@Table(name = "PO_HEADER_ITEM")
public class PoItem {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "PO_ITEM_ID", nullable = false)
    private Long poItemId;

    @Column(name = "MATERIAL")
    private String material;

    @Column(name = "QUANTITY")
    private Integer quantity;

    @Column(name = "UOM")
    private String uom;

    @ManyToOne
    @JoinColumn(name = "PO_ID", nullable = false)
    @JsonIgnoreProperties({"orderDate", "deliveryDate", "vendor", "items"})  // breaks circular reference — PoItem will NOT serialize purchaseOrder back
    private PoHeader purchaseOrder;

    public PoItem() {
    }

    
	public PoItem(Long poItemId, String material, Integer quantity, String uom, PoHeader purchaseOrder) {
		super();
		this.poItemId = poItemId;
		this.material = material;
		this.quantity = quantity;
		this.uom = uom;
		this.purchaseOrder = purchaseOrder;
	}


	public Long getPoItemId() {
		return poItemId;
	}

	public void setPoItemId(Long poItemId) {
		this.poItemId = poItemId;
	}

	public String getMaterial() {
		return material;
	}

	public void setMaterial(String material) {
		this.material = material;
	}

	public Integer getQuantity() {
		return quantity;
	}

	public void setQuantity(Integer quantity) {
		this.quantity = quantity;
	}

	public String getUom() {
		return uom;
	}

	public void setUom(String uom) {
		this.uom = uom;
	}

	public PoHeader getPurchaseOrder() {
		return purchaseOrder;
	}

	public void setPurchaseOrder(PoHeader purchaseOrder) {
		this.purchaseOrder = purchaseOrder;
	}

   
}