package com.punit.repository;

import org.springframework.data.jpa.repository.JpaRepository;

import com.punit.entities.PoHeader;

public interface IPoHeaderPersistence extends JpaRepository<PoHeader, Long> {

}
