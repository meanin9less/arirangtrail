package com.example.arirangtrail.service.chat;

import com.example.arirangtrail.data.document.Counter;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.mongodb.core.MongoOperations;
import org.springframework.data.mongodb.core.query.Update;
import org.springframework.stereotype.Service;

import java.util.Objects;

import static org.springframework.data.mongodb.core.FindAndModifyOptions.options;
import static org.springframework.data.mongodb.core.query.Criteria.where;
import static org.springframework.data.mongodb.core.query.Query.query;

@Service
public class SequenceService {
    private final MongoOperations mongoOperations;

    public SequenceService(MongoOperations mongoOperations) {
        this.mongoOperations = mongoOperations;
    }

    public long generateSequence(String seqName) {
        Counter counter = mongoOperations.findAndModify(query(where("_id").is(seqName)),
                new Update().inc("seq", 1), options().returnNew(true).upsert(true),
                Counter.class);
        return !Objects.isNull(counter) ? counter.getSeq() : 1;
    }
}

// 그 대상을 먼저 1증가 시킨후 해당 숫자를 내가 가져와서 쓸수 있도록 하는 서비스 및 함수
