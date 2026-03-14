package com.punit.entities;

import java.time.LocalDate;
import java.util.List;

import com.fasterxml.jackson.annotation.JsonManagedReference;

import jakarta.persistence.*;

@Entity
@Table(name = "SALESORDER_HEADER")
public class SalesOrderHeader {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "SALES_ORDER_NUMBER", nullable = false)
    private Long salesOrderNumber;

    @Column(name = "ORDER_DATE")
    private LocalDate dateOfOrder;

    @Column(name = "DELIVERY_DATE")
    private LocalDate dateOfDelivery;

	
	  @ManyToOne	  
		/* @JsonManagedReference */
	  @JoinColumn(name = "CUSTOMER_ID", nullable = false) private Customer
	  customer;
	 

	  @JsonManagedReference
		  @OneToMany(mappedBy = "salesOrderHeader", cascade = CascadeType.ALL) private
		  List<SalesOrderItem> items;
		 

    public SalesOrderHeader() {
    }

    public SalesOrderHeader(Long salesOrderNumber, LocalDate dateOfOrder,
                      LocalDate dateOfDelivery, Customer customer) {

        this.salesOrderNumber = salesOrderNumber;
        this.dateOfOrder = dateOfOrder;
        this.dateOfDelivery = dateOfDelivery;
        this.customer = customer;
    }


    public Long getSalesOrderNumber() {
        return salesOrderNumber;
    }

    public void setSalesOrderNumber(Long salesOrderNumber) {
        this.salesOrderNumber = salesOrderNumber;
    }

    public LocalDate getDateOfOrder() {
        return dateOfOrder;
    }

    public void setDateOfOrder(LocalDate dateOfOrder) {
        this.dateOfOrder = dateOfOrder;
    }

    public LocalDate getDateOfDelivery() {
        return dateOfDelivery;
    }

    public void setDateOfDelivery(LocalDate dateOfDelivery) {
        this.dateOfDelivery = dateOfDelivery;
    }

	
	  public Customer getCustomer() { return customer; }
	  
	  public void setCustomer(Customer customer) { this.customer = customer; }
	 

		/*
		 * public List<SalesOrderItem> getItems() { return items; }
		 * 
		 * public void setItems(List<SalesOrderItem> items) { this.items = items; }
		 */
}