package com.punit.repository;

import org.springframework.data.jpa.repository.JpaRepository;

import com.punit.entities.PoItem;

public interface IPoItemPersistence extends JpaRepository<PoItem, Long>{

}
