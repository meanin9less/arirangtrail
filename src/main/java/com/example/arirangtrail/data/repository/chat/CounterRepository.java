package com.example.arirangtrail.data.repository.chat;

import com.example.arirangtrail.data.document.Counter;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface CounterRepository extends MongoRepository<Counter, String> {
}
