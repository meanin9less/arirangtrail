package com.example.arirangtrail.data.dto;

import lombok.Getter;
import lombok.NoArgsConstructor;
import org.springframework.data.domain.Page;

@Getter
@NoArgsConstructor
public class PaginationDto {
    private int currentPage;
    private int pageSize;
    private long totalElements;
    private int totalPages;

    public PaginationDto(Page<?> page) {
        this.currentPage = page.getNumber();
        this.pageSize = page.getSize();
        this.totalElements = page.getTotalElements();
        this.totalPages = page.getTotalPages();
    }
}
