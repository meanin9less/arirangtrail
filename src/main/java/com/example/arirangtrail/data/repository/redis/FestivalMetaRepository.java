    package com.example.arirangtrail.data.repository.redis;

    import com.example.arirangtrail.data.entity.redis.FestivalMetaEntity;
    import org.springframework.data.jpa.repository.JpaRepository;
    import org.springframework.stereotype.Repository;

    @Repository
    public interface FestivalMetaRepository extends JpaRepository<FestivalMetaEntity,Long> {
    }
