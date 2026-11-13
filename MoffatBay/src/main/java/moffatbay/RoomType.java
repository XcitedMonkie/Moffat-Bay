package moffatbay;
import java.math.BigDecimal;

public record RoomType(int roomTypeId, String typeName, String description,
                       int maxGuest, BigDecimal basePrice) {}
