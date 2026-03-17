package com.punit.entities;

import java.time.LocalDate;
import java.util.List;
import jakarta.persistence.*;

@Entity
@Table(name = "PO_HEADER")
public class PoHeader {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "PO_ID", nullable = false)
    private Long poId;

    @Column(name = "ORDER_DATE")
    private LocalDate orderDate;

    @Column(name = "DELIVERY_DATE")
    private LocalDate deliveryDate;

    @ManyToOne
    @JoinColumn(name = "VENDOR_ID", nullable = false)
    private Vendor vendor;

    @OneToMany(mappedBy = "purchaseOrder", cascade = CascadeType.ALL)
    private List<PoItem> items;

    
    
	public PoHeader() {
		
	}



	public Long getPoId() {
		return poId;
	}



	public void setPoId(Long poId) {
		this.poId = poId;
	}



	public LocalDate getOrderDate() {
		return orderDate;
	}



	public void setOrderDate(LocalDate orderDate) {
		this.orderDate = orderDate;
	}



	public LocalDate getDeliveryDate() {
		return deliveryDate;
	}



	public void setDeliveryDate(LocalDate deliveryDate) {
		this.deliveryDate = deliveryDate;
	}



	public Vendor getVendor() {
		return vendor;
	}



	public void setVendor(Vendor vendor) {
		this.vendor = vendor;
	}



	public List<PoItem> getItems() {
		return items;
	}



	public void setItems(List<PoItem> items) {
		this.items = items;
	}



	public PoHeader(Long poId, LocalDate orderDate, LocalDate deliveryDate, Vendor vendor) {
		super();
		this.poId = poId;
		this.orderDate = orderDate;
		this.deliveryDate = deliveryDate;
		this.vendor = vendor;
		
	}

	
   
}